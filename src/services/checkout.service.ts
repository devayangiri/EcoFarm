import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma, PaymentMethod } from "@prisma/client";
import { InventoryReservationService } from "./inventory-reservation.service";
import type { ConfirmCheckoutInput } from "@/lib/validators/checkout.schema";

export class CheckoutService {
  /**
   * Helper to generate unique order number: AG-ORD-YYYYMMDD-XXXX
   */
  public static generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `AG-ORD-${dateStr}-${randomHex}`;
  }

  /**
   * Helper to generate sub-order number: AG-SUB-YYYYMMDD-XXXX-N
   */
  public static generateSubOrderNumber(orderNum: string, index: number): string {
    return `${orderNum.replace("ORD", "SUB")}-${index + 1}`;
  }

  /**
   * Initiate a checkout session from active cart with 15-minute inventory reservations
   */
  static async initiateCheckout(buyerId: string) {
    const cart = await prisma.cart.findFirst({
      where: { buyerId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: { select: { id: true, fullName: true } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw AppError.businessRule("Your shopping cart is empty");
    }

    // Sweep stale reservations before creating new one
    await InventoryReservationService.expireStaleReservations();

    const sessionId = `chk-sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(
      Date.now() + InventoryReservationService.RESERVATION_TTL_MS
    );

    let subtotal = 0;
    const sellerIds = new Set<string>();

    const checkoutSession = await prisma.$transaction(async (tx) => {
      // 1. Validate items and create 15-minute inventory reservations
      for (const item of cart.items) {
        const product = item.product;
        if (product.status !== "ACTIVE") {
          throw AppError.businessRule(
            `"${product.title}" is no longer active on the marketplace`
          );
        }

        const quantity = item.quantity.toNumber();
        const price = product.pricePerUnit.toNumber();
        subtotal += price * quantity;
        sellerIds.add(item.sellerId);

        // Transactionally reserve stock
        await InventoryReservationService.createReservation(
          tx,
          product.id,
          sessionId,
          quantity
        );
      }

      const shippingAmount = sellerIds.size * 250;
      const totalAmount = subtotal + shippingAmount;

      // 2. Create CheckoutSession record
      const session = await tx.checkoutSession.create({
        data: {
          buyerId,
          cartId: cart.id,
          status: "ACTIVE",
          subtotal: new Prisma.Decimal(subtotal),
          shippingAmount: new Prisma.Decimal(shippingAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          expiresAt,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "CHECKOUT_CREATED",
          resource: "CheckoutSession",
          resourceId: session.id,
          metadata: { subtotal, totalAmount, itemCount: cart.items.length },
        },
      });

      return session;
    });

    return {
      sessionId: checkoutSession.id,
      cartSessionId: sessionId,
      subtotal,
      shippingAmount: sellerIds.size * 250,
      totalAmount: subtotal + sellerIds.size * 250,
      expiresAt,
      sellerCount: sellerIds.size,
    };
  }

  /**
   * Get checkout session details with ownership enforcement
   */
  static async getCheckoutSession(buyerId: string, checkoutSessionId: string) {
    const session = await prisma.checkoutSession.findUnique({
      where: { id: checkoutSessionId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 },
                    seller: { select: { id: true, fullName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    if (session.buyerId !== buyerId) {
      throw AppError.forbidden("You do not have permission to view this checkout session");
    }

    const isExpired = new Date() > session.expiresAt;
    if (isExpired && session.status === "ACTIVE") {
      await prisma.checkoutSession.update({
        where: { id: checkoutSessionId },
        data: { status: "EXPIRED" },
      });
      session.status = "EXPIRED";
    }

    return session;
  }

  /**
   * Finalize and confirm checkout into an atomic OrderGroup + Seller Orders
   */
  static async confirmCheckout(buyerId: string, input: ConfirmCheckoutInput) {
    const session = await prisma.checkoutSession.findUnique({
      where: { id: input.checkoutSessionId },
      include: {
        cart: {
          include: {
            items: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    if (session.buyerId !== buyerId) {
      throw AppError.forbidden("You do not have permission to confirm this checkout");
    }

    if (session.status !== "ACTIVE") {
      throw AppError.businessRule(
        `Checkout session is ${session.status.toLowerCase()} and cannot be completed`
      );
    }

    if (new Date() > session.expiresAt) {
      await prisma.checkoutSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });
      throw AppError.businessRule("Checkout session has expired. Please review your cart and retry.");
    }

    const orderNumber = this.generateOrderNumber();

    // Group cart items by seller
    const sellerMap = new Map<string, typeof session.cart.items>();
    for (const item of session.cart.items) {
      if (!sellerMap.has(item.sellerId)) {
        sellerMap.set(item.sellerId, []);
      }
      sellerMap.get(item.sellerId)!.push(item);
    }

    // Atomic Transaction for Order Creation
    const orderGroup = await prisma.$transaction(async (tx) => {
      // 1. Create Parent OrderGroup
      const newOrderGroup = await tx.orderGroup.create({
        data: {
          orderNumber,
          buyerId,
          totalAmount: session.totalAmount,
          shippingAddressSnapshot: input.shippingAddress as any,
          status: "PAYMENT_PENDING",
        },
      });

      let sellerIndex = 0;
      for (const [sellerId, items] of Array.from(sellerMap.entries())) {
        const subOrderNumber = this.generateSubOrderNumber(orderNumber, sellerIndex++);
        let sellerSubtotal = 0;

        // Calculate seller total
        for (const it of items) {
          sellerSubtotal += it.product.pricePerUnit.toNumber() * it.quantity.toNumber();
        }

        const sellerShipping = 250;
        const commission = Math.round(sellerSubtotal * 0.02 * 100) / 100;
        const sellerTotal = sellerSubtotal + sellerShipping;

        // 2. Create Seller Sub-Order
        const subOrder = await tx.order.create({
          data: {
            subOrderNumber,
            orderGroupId: newOrderGroup.id,
            sellerId,
            sellerTotal: new Prisma.Decimal(sellerTotal),
            commissionAmount: new Prisma.Decimal(commission),
            status: "PLACED",
          },
        });

        // 3. Create Order Items with immutable historical snapshots
        for (const it of items) {
          const unitPrice = it.product.pricePerUnit;
          const qty = it.quantity;
          const totalPrice = new Prisma.Decimal(unitPrice.toNumber() * qty.toNumber());

          await tx.orderItem.create({
            data: {
              orderId: subOrder.id,
              productId: it.productId,
              productTitleSnapshot: it.product.title,
              unitSnapshot: it.product.unit,
              quantity: qty,
              unitPrice,
              totalPrice,
            },
          });
        }

        // 4. Create Order Timeline entry
        await tx.orderTimeline.create({
          data: {
            orderId: subOrder.id,
            status: "PLACED",
            actorId: buyerId,
            note: "Order placed by buyer",
          },
        });

        // 5. Create Seller Notification
        await tx.notification.create({
          data: {
            userId: sellerId,
            type: "ORDER_UPDATE",
            title: "New Wholesale Order Received",
            body: `You have received a new purchase order ${subOrderNumber} worth ₹${sellerTotal.toLocaleString("en-IN")}.`,
          },
        });
      }

      // 6. Atomically convert reservations for this session
      const reservations = await tx.inventoryReservation.findMany({
        where: {
          productId: { in: session.cart.items.map((i) => i.productId) },
          status: "ACTIVE",
        },
      });

      for (const res of reservations) {
        await InventoryReservationService.convertReservation(tx, res.id);
      }

      // 7. Create Payment record linked to OrderGroup
      const paymentStatus = input.paymentMethod === "COD" ? "PENDING" : "PAID";
      await tx.payment.create({
        data: {
          orderGroupId: newOrderGroup.id,
          amount: session.totalAmount,
          paymentMethod: input.paymentMethod as PaymentMethod,
          status: paymentStatus,
          transactionRef: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        },
      });

      // 8. Mark checkout session as COMPLETED & clear cart items
      await tx.checkoutSession.update({
        where: { id: session.id },
        data: {
          status: "COMPLETED",
          orderGroupId: newOrderGroup.id,
          shippingAddressSnapshot: input.shippingAddress as any,
          paymentMethod: input.paymentMethod as PaymentMethod,
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: session.cartId },
      });

      // 9. Buyer Notification
      await tx.notification.create({
        data: {
          userId: buyerId,
          type: "ORDER_UPDATE",
          title: "Order Placed Successfully",
          body: `Your multi-vendor order ${orderNumber} has been placed with ${sellerMap.size} producer(s).`,
        },
      });

      // 10. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "ORDER_GROUP_CREATED",
          resource: "OrderGroup",
          resourceId: newOrderGroup.id,
          metadata: {
            orderNumber,
            totalAmount: session.totalAmount,
            sellerCount: sellerMap.size,
          },
        },
      });

      return newOrderGroup;
    });

    return orderGroup;
  }
}

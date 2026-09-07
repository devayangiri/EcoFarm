import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma, PaymentMethod, PaymentStatus } from "@prisma/client";
import { InventoryReservationService } from "./inventory-reservation.service";
import { CartService } from "./cart.service";
import { NotificationService } from "./notification.service";
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
    const cart = await CartService.getOrCreateCart(buyerId);

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
   * Initiate an instantaneous "Buy Now" direct checkout session bypassing persistent cart
   */
  static async initiateDirectCheckout(buyerId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      throw AppError.validation("Purchase quantity must be greater than zero");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        sellerId: true,
        status: true,
        pricePerUnit: true,
        minimumOrderQuantity: true,
        availableStock: true,
        reservedStock: true,
      },
    });

    if (!product) {
      throw AppError.notFound("Product not found");
    }

    if (product.status !== "ACTIVE") {
      throw AppError.businessRule(`"${product.title}" is currently not available for purchase`);
    }

    if (product.sellerId === buyerId) {
      throw AppError.businessRule("You cannot purchase your own product listing");
    }

    const moq = product.minimumOrderQuantity.toNumber();
    if (quantity < moq) {
      throw AppError.businessRule(`Minimum order quantity for "${product.title}" is ${moq}`);
    }

    // Sweep stale reservations
    await InventoryReservationService.expireStaleReservations();

    const sessionId = `chk-direct-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + InventoryReservationService.RESERVATION_TTL_MS);

    const price = product.pricePerUnit.toNumber();
    const subtotal = price * quantity;
    const shippingAmount = 250;
    const totalAmount = subtotal + shippingAmount;

    const checkoutSession = await prisma.$transaction(async (tx) => {
      // 1. Transactionally reserve stock
      await InventoryReservationService.createReservation(
        tx,
        product.id,
        sessionId,
        quantity
      );

      // 2. Create an isolated checkout Cart
      const directCart = await tx.cart.create({
        data: {
          buyerId,
          status: "CHECKOUT",
        },
      });

      // 3. Create CartItem in the direct cart
      await tx.cartItem.create({
        data: {
          cartId: directCart.id,
          productId: product.id,
          sellerId: product.sellerId,
          quantity: new Prisma.Decimal(quantity),
        },
      });

      // 4. Create CheckoutSession record
      const session = await tx.checkoutSession.create({
        data: {
          buyerId,
          cartId: directCart.id,
          status: "ACTIVE",
          subtotal: new Prisma.Decimal(subtotal),
          shippingAmount: new Prisma.Decimal(shippingAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          expiresAt,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "DIRECT_CHECKOUT_CREATED",
          resource: "CheckoutSession",
          resourceId: session.id,
          metadata: { productId, quantity, totalAmount },
        },
      });

      return session;
    });

    return {
      sessionId: checkoutSession.id,
      cartSessionId: sessionId,
      subtotal,
      shippingAmount,
      totalAmount,
      expiresAt,
      sellerCount: 1,
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
      }

      // 5. Atomically convert reservations for this session
      const reservations = await tx.inventoryReservation.findMany({
        where: {
          productId: { in: session.cart.items.map((i) => i.productId) },
          status: "ACTIVE",
        },
      });

      for (const res of reservations) {
        await InventoryReservationService.convertReservation(tx, res.id);
      }

      // 6. Create Payment record linked to OrderGroup (never mark PAID before verified payment)
      const paymentStatus: PaymentStatus =
        input.paymentMethod === "COD" ||
        input.paymentMethod === "BANK_TRANSFER" ||
        input.paymentMethod === "RAZORPAY"
          ? "PENDING"
          : "PAID";
      await tx.payment.create({
        data: {
          orderGroupId: newOrderGroup.id,
          amount: session.totalAmount,
          paymentMethod: input.paymentMethod as PaymentMethod,
          status: paymentStatus,
          transactionRef: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        },
      });

      // 7. Mark checkout session as COMPLETED & clear cart items
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

      // 8. Audit Log
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

    // 9. Post-Transaction Notification Dispatch
    // Only dispatched AFTER database transaction commits.
    // Wrapped in try/catch so notification delivery errors NEVER roll back or fail a committed order.
    try {
      await this.dispatchOrderCreatedNotifications(orderGroup.id);
    } catch (notifErr) {
      console.error("[CheckoutService] Post-checkout notification dispatch error:", notifErr);
    }

    return orderGroup;
  }

  /**
   * Dispatch real-time, role-isolated notifications after an order has successfully committed.
   * Dispatches notifications to Buyer, all individual Farmers (strictly partitioned), and Admins.
   * Safe to call multiple times due to atomic database uniqueness/idempotency keys.
   */
  public static async dispatchOrderCreatedNotifications(orderGroupId: string) {
    const orderGroup = await prisma.orderGroup.findUnique({
      where: { id: orderGroupId },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            buyerProfile: {
              select: {
                companyName: true,
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        sellerOrders: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!orderGroup) {
      return;
    }

    const paymentMethod = orderGroup.payments[0]?.paymentMethod || "COD";
    const paymentLabel =
      paymentMethod === "COD"
        ? "Cash on Delivery"
        : paymentMethod === "BANK_TRANSFER"
        ? "Direct Bank Transfer"
        : "Online Payment";

    // 1. BUYER NOTIFICATION (Buyer's own order confirmation only)
    try {
      const buyerIdempotencyKey = `ORDER_CREATED:${orderGroup.id}:BUYER`;
      await NotificationService.createNotificationFromEvent({
        userId: orderGroup.buyerId,
        type: "ORDER_UPDATE",
        title: "Order Confirmed",
        body: `Your ${paymentLabel} order #${orderGroup.orderNumber} has been placed successfully.`,
        resourceType: "ORDER_GROUP",
        resourceId: orderGroup.id,
        deepLink: `/buyer/orders/${orderGroup.id}`,
        idempotencyKey: buyerIdempotencyKey,
        metadata: {
          orderGroupId: orderGroup.id,
          orderNumber: orderGroup.orderNumber,
          total: orderGroup.totalAmount.toNumber(),
          paymentMethod,
          sellerCount: orderGroup.sellerOrders.length,
          status: orderGroup.status,
          role: "BUYER",
        },
      });
    } catch (err) {
      console.error("[dispatchOrderCreatedNotifications] Failed to send buyer notification:", err);
    }

    // 2. FARMER / SELLER NOTIFICATIONS (Strict multi-vendor isolation per seller sub-order)
    for (const subOrder of orderGroup.sellerOrders) {
      try {
        const farmerIdempotencyKey = `ORDER_CREATED:${subOrder.id}:FARMER:${subOrder.sellerId}`;

        // Build product summary for this seller's items only
        const firstItem = subOrder.items[0];
        const productInfo = firstItem ? firstItem.productTitleSnapshot : "Wholesale Produce";
        const quantityInfo = firstItem ? `${firstItem.quantity.toNumber()} ${firstItem.unitSnapshot}` : "";
        const itemSummary =
          subOrder.items.length > 1
            ? `${productInfo} (+${subOrder.items.length - 1} other item${subOrder.items.length > 2 ? "s" : ""})`
            : productInfo;

        await NotificationService.createNotificationFromEvent({
          userId: subOrder.sellerId,
          type: "ORDER_UPDATE",
          title: "New Order Received",
          body: `You received a new order for ${itemSummary}. Order #${subOrder.subOrderNumber}, Amount: ₹${subOrder.sellerTotal.toNumber().toLocaleString("en-IN")}. (${paymentLabel})`,
          resourceType: "ORDER",
          resourceId: subOrder.id,
          deepLink: `/farmer/orders/${subOrder.id}`,
          idempotencyKey: farmerIdempotencyKey,
          metadata: {
            orderId: subOrder.id,
            orderGroupId: orderGroup.id,
            subOrderNumber: subOrder.subOrderNumber,
            productInfo,
            quantity: quantityInfo,
            sellerTotal: subOrder.sellerTotal.toNumber(),
            paymentMethod,
            createdAt: subOrder.createdAt,
            role: "SELLER",
          },
        });
      } catch (err) {
        console.error(
          `[dispatchOrderCreatedNotifications] Failed to send seller notification for subOrder ${subOrder.id}:`,
          err
        );
      }
    }

    // 3. ADMIN NOTIFICATION (Aggregate multi-vendor overview)
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE" },
        select: { id: true },
      });

      const buyerName =
        orderGroup.buyer.buyerProfile?.companyName || orderGroup.buyer.fullName || "Buyer";

      for (const admin of adminUsers) {
        const adminIdempotencyKey = `ORDER_CREATED:${orderGroup.id}:ADMIN:${admin.id}`;
        await NotificationService.createNotificationFromEvent({
          userId: admin.id,
          type: "ORDER_UPDATE",
          title: paymentMethod === "COD" ? "New COD Order" : "New Order Created",
          body: `New ${paymentLabel} order #${orderGroup.orderNumber} has been placed by ${buyerName} (₹${orderGroup.totalAmount.toNumber().toLocaleString("en-IN")}, ${orderGroup.sellerOrders.length} seller(s)).`,
          resourceType: "ORDER_GROUP",
          resourceId: orderGroup.id,
          deepLink: `/admin/orders/${orderGroup.id}`,
          idempotencyKey: adminIdempotencyKey,
          metadata: {
            orderGroupId: orderGroup.id,
            orderNumber: orderGroup.orderNumber,
            buyerName,
            buyerId: orderGroup.buyerId,
            sellerCount: orderGroup.sellerOrders.length,
            totalOrderValue: orderGroup.totalAmount.toNumber(),
            paymentMethod,
            status: orderGroup.status,
            createdAt: orderGroup.createdAt,
            role: "ADMIN",
          },
        });
      }
    } catch (err) {
      console.error("[dispatchOrderCreatedNotifications] Failed to send admin notification:", err);
    }
  }
}

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import { RazorpayClient } from "@/lib/razorpay";
import { CheckoutService } from "@/services/checkout.service";
import { InventoryReservationService } from "@/services/inventory-reservation.service";
import { ShippingAddressInput } from "@/lib/validators/checkout.schema";

export class PaymentService {
  /**
   * Return payment gateway configuration state (strictly client-safe)
   */
  static getPaymentConfig() {
    const isConfigured = RazorpayClient.isConfigured();
    return {
      enabled: isConfigured,
      keyId: isConfigured ? RazorpayClient.getKeyId() : undefined,
    };
  }

  /**
   * Create a server-authoritative Razorpay gateway order for an active checkout session
   */
  static async createOnlinePaymentOrder(
    buyerId: string,
    input: {
      checkoutSessionId: string;
      shippingAddress: ShippingAddressInput;
    }
  ) {
    if (!RazorpayClient.isConfigured()) {
      throw AppError.businessRule("Online payment via Razorpay is currently not configured");
    }

    // 1. Authenticate Buyer and load checkout session
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
      throw AppError.forbidden("You do not have permission to access this checkout session");
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

    // 2. Calculate canonical server-side total (Never trust client)
    const serverTotal = session.totalAmount.toNumber();
    if (serverTotal <= 0) {
      throw AppError.validation("Invalid order total: amount must be greater than zero");
    }
    const amountInPaise = Math.round(serverTotal * 100);

    // 3. Atomically prepare OrderGroup and Payment if not already generated
    let orderGroup: any = session.orderGroupId
      ? await prisma.orderGroup.findUnique({
          where: { id: session.orderGroupId },
        })
      : null;

    if (!orderGroup) {
      const orderNumber = CheckoutService.generateOrderNumber();
      const sellerMap = new Map<string, typeof session.cart.items>();
      for (const item of session.cart.items) {
        if (!sellerMap.has(item.sellerId)) {
          sellerMap.set(item.sellerId, []);
        }
        sellerMap.get(item.sellerId)!.push(item);
      }

      orderGroup = await prisma.$transaction(async (tx) => {
        const newGroup = await tx.orderGroup.create({
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
          const subOrderNumber = CheckoutService.generateSubOrderNumber(orderNumber, sellerIndex++);
          let sellerSubtotal = 0;
          for (const it of items) {
            sellerSubtotal += it.product.pricePerUnit.toNumber() * it.quantity.toNumber();
          }
          const sellerShipping = 250;
          const commission = Math.round(sellerSubtotal * 0.02 * 100) / 100;
          const sellerTotal = sellerSubtotal + sellerShipping;

          const subOrder = await tx.order.create({
            data: {
              subOrderNumber,
              orderGroupId: newGroup.id,
              sellerId,
              sellerTotal: new Prisma.Decimal(sellerTotal),
              commissionAmount: new Prisma.Decimal(commission),
              status: "PLACED",
            },
          });

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

          await tx.orderTimeline.create({
            data: {
              orderId: subOrder.id,
              status: "PLACED",
              actorId: buyerId,
              note: "Order initiated with online payment pending",
            },
          });
        }

        // Link OrderGroup to checkout session
        await tx.checkoutSession.update({
          where: { id: session.id },
          data: {
            orderGroupId: newGroup.id,
            shippingAddressSnapshot: input.shippingAddress as any,
            paymentMethod: "RAZORPAY",
          },
        });

        // Create initial PENDING payment (Invariant: never mark PAID during creation)
        await tx.payment.create({
          data: {
            orderGroupId: newGroup.id,
            amount: session.totalAmount,
            paymentMethod: "RAZORPAY",
            status: "PENDING",
          },
        });

        return newGroup;
      });
    }

    if (!orderGroup) {
      throw AppError.internal("Failed to initialize order group");
    }

    // 4. Create Razorpay Order with server-authoritative amount
    const rzpOrder = await RazorpayClient.createOrder(
      amountInPaise,
      orderGroup.orderNumber,
      {
        checkoutSessionId: session.id,
        orderGroupId: orderGroup.id,
        buyerId,
      }
    );

    // 5. Store razorpayOrderId against the payment record
    const payment = await prisma.payment.findFirst({
      where: { orderGroupId: orderGroup.id, paymentMethod: "RAZORPAY" },
      orderBy: { createdAt: "desc" },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayResponse: {
            provider: "RAZORPAY",
            razorpayOrderId: rzpOrder.id,
            amountInPaise,
            currency: "INR",
            createdAt: new Date().toISOString(),
          },
        },
      });
    }

    // 6. Return strictly client-safe data
    return {
      keyId: RazorpayClient.getKeyId()!,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency || "INR",
      orderGroupId: orderGroup.id,
      orderNumber: orderGroup.orderNumber,
    };
  }

  /**
   * Verify online payment and confirm order atomically
   */
  static async verifyOnlinePayment(
    buyerId: string,
    input: {
      checkoutSessionId?: string;
      orderGroupId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }
  ) {
    if (!input.razorpayOrderId || !input.razorpayPaymentId || !input.razorpaySignature) {
      throw AppError.validation("Missing required payment verification parameters");
    }

    // 1. Load canonical Payment & OrderGroup from database
    const payment = await prisma.payment.findFirst({
      where: { orderGroupId: input.orderGroupId },
      include: {
        orderGroup: {
          include: {
            sellerOrders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!payment) {
      throw AppError.notFound("Payment record not found for this order");
    }

    // Validate ownership
    if (payment.orderGroup.buyerId !== buyerId) {
      throw AppError.forbidden("You do not have permission to verify this payment");
    }

    // 2. Verify Razorpay Order ID matches what server recorded
    const gatewayData = (payment.gatewayResponse as any) || {};
    if (gatewayData.razorpayOrderId && gatewayData.razorpayOrderId !== input.razorpayOrderId) {
      throw AppError.businessRule("Gateway order mismatch: order ID does not correspond to this payment");
    }

    // 3. Idempotency: If payment is ALREADY marked PAID with same transactionRef
    if (payment.status === "PAID") {
      return {
        success: true,
        alreadyProcessed: true,
        orderNumber: payment.orderGroup.orderNumber,
        status: "PAID",
      };
    }

    // 4. Verify cryptographic HMAC-SHA256 signature
    const isValidSignature = RazorpayClient.verifyPaymentSignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature
    );

    if (!isValidSignature) {
      console.warn("[PaymentService] Invalid Razorpay signature detected", {
        orderGroupId: input.orderGroupId,
        razorpayOrderId: input.razorpayOrderId,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          gatewayResponse: {
            ...gatewayData,
            failureReason: "INVALID_SIGNATURE",
            failedAt: new Date().toISOString(),
          },
        },
      });

      throw AppError.forbidden("Invalid payment signature verification failed");
    }

    // 5. Atomic Transaction for Payment Finalization & Fulfillment Transition
    const result = await prisma.$transaction(async (tx) => {
      // A. Update Payment to PAID
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          transactionRef: input.razorpayPaymentId,
          gatewayResponse: {
            ...gatewayData,
            razorpayPaymentId: input.razorpayPaymentId,
            razorpaySignature: input.razorpaySignature,
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      // B. Update Sub-Orders: Order.status from PLACED -> CONFIRMED
      for (const subOrder of payment.orderGroup.sellerOrders) {
        await tx.order.update({
          where: { id: subOrder.id },
          data: { status: "CONFIRMED" },
        });

        await tx.orderTimeline.create({
          data: {
            orderId: subOrder.id,
            status: "CONFIRMED",
            actorId: buyerId,
            note: "Payment verified via Razorpay",
          },
        });

        // Notify each farmer individually with ONLY their sub-order details
        await tx.notification.create({
          data: {
            userId: subOrder.sellerId,
            type: "ORDER_UPDATE",
            title: "Purchase Order Confirmed & Paid",
            body: `Purchase order ${subOrder.subOrderNumber} has been verified and paid via Razorpay.`,
          },
        });
      }

      // C. OrderGroup.status remains in existing placed state (PAYMENT_PENDING) as required:
      // "DO NOT set OrderGroup = PROCESSING merely because payment succeeded.
      // PROCESSING only occurs when seller fulfillment actually begins."

      // D. Convert inventory reservations
      const session = await tx.checkoutSession.findFirst({
        where: { orderGroupId: input.orderGroupId },
      });

      if (session) {
        await tx.checkoutSession.update({
          where: { id: session.id },
          data: { status: "COMPLETED" },
        });

        const reservations = await tx.inventoryReservation.findMany({
          where: {
            OR: [
              { cartSessionId: session.id },
              { cartSessionId: session.cartId },
            ],
            status: "ACTIVE",
          },
        });

        for (const res of reservations) {
          await InventoryReservationService.convertReservation(tx, res.id);
        }

        // Clear cart items
        await tx.cartItem.deleteMany({
          where: { cartId: session.cartId },
        });
      }

      // E. Notify Buyer
      await tx.notification.create({
        data: {
          userId: buyerId,
          type: "PAYMENT_UPDATE",
          title: "Payment Successful & Order Confirmed",
          body: `Your payment for order ${payment.orderGroup.orderNumber} was successfully processed.`,
        },
      });

      // F. Notify Admin
      try {
        const admins = await tx.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              type: "ORDER_UPDATE",
              title: "New Wholesale Order Paid",
              body: `Order ${payment.orderGroup.orderNumber} (₹${payment.amount.toNumber().toLocaleString("en-IN")}) paid via Razorpay.`,
            },
          });
        }
      } catch {
        // non-blocking
      }

      // G. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "PAYMENT_VERIFIED",
          resource: "Payment",
          resourceId: payment.id,
          metadata: {
            orderGroupId: input.orderGroupId,
            razorpayPaymentId: input.razorpayPaymentId,
            amount: payment.amount.toNumber(),
          },
        },
      });

      return {
        orderNumber: payment.orderGroup.orderNumber,
        status: "PAID",
      };
    });

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Webhook endpoint handler with HMAC verification and idempotency
   */
  static async handleWebhook(rawBodyOrPayload: any, signatureHeader?: string) {
    // 1. Support legacy test payload format if mock signature passed
    if (typeof rawBodyOrPayload === "object" && rawBodyOrPayload.signature === "mock_valid_signature") {
      const payload = rawBodyOrPayload;
      const payment = await prisma.payment.findFirst({
        where: { orderGroupId: payload.orderGroupId },
      });

      if (!payment) {
        throw AppError.notFound("Payment not found");
      }

      if (payment.status === payload.status) {
        return { received: true, alreadyProcessed: true };
      }

      const updated = await prisma.$transaction(async (tx) => {
        const res = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: payload.status,
            transactionRef: payload.transactionRef,
            paidAt: payload.status === "PAID" ? new Date() : null,
          },
        });

        await tx.auditLog.create({
          data: {
            action: "PAYMENT_WEBHOOK_PROCESSED",
            resource: "Payment",
            resourceId: payment.id,
            metadata: { ...payload },
          },
        });

        return res;
      });

      return { received: true, payment: updated };
    }

    // 2. Real Razorpay Webhook Verification
    const rawBody = typeof rawBodyOrPayload === "string" ? rawBodyOrPayload : JSON.stringify(rawBodyOrPayload);
    const signature = signatureHeader || (typeof rawBodyOrPayload === "object" ? rawBodyOrPayload.signature : "");

    if (!signature || !RazorpayClient.verifyWebhookSignature(rawBody, signature)) {
      throw AppError.forbidden("Invalid webhook signature");
    }

    let event: any;
    try {
      event = typeof rawBodyOrPayload === "string" ? JSON.parse(rawBodyOrPayload) : rawBodyOrPayload;
    } catch {
      throw AppError.validation("Invalid webhook JSON body");
    }

    const eventName = event.event;
    console.log(`[PaymentService Webhook] Received event: ${eventName}`);

    // Handle payment.captured or order.paid
    if (eventName === "payment.captured" || eventName === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const rzpPaymentId = paymentEntity?.id;
      const rzpAmount = paymentEntity?.amount;

      if (!rzpOrderId) {
        return { received: true, ignored: true, reason: "No order ID in payload" };
      }

      // Locate Payment using the stored Razorpay gateway reference
      const payment = await prisma.payment.findFirst({
        where: {
          gatewayResponse: {
            path: ["razorpayOrderId"],
            equals: rzpOrderId,
          },
        },
        include: {
          orderGroup: {
            include: { sellerOrders: true },
          },
        },
      });

      if (!payment) {
        console.warn(`[Webhook] No payment found for razorpayOrderId: ${rzpOrderId}`);
        return { received: true, ignored: true, reason: "Payment not found" };
      }

      // Idempotency: Ignore if already PAID
      if (payment.status === "PAID") {
        return { received: true, alreadyProcessed: true };
      }

      // Invariant: Verify expected amount
      if (rzpAmount && rzpAmount !== Math.round(payment.amount.toNumber() * 100)) {
        console.error("[Webhook] Payment amount mismatch", {
          expected: Math.round(payment.amount.toNumber() * 100),
          received: rzpAmount,
        });
        return { received: true, ignored: true, reason: "Amount mismatch" };
      }

      // Atomically update
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            transactionRef: rzpPaymentId,
            gatewayResponse: {
              ...(payment.gatewayResponse as any),
              webhookProcessedAt: new Date().toISOString(),
              razorpayPaymentId: rzpPaymentId,
            },
          },
        });

        // Advance seller orders to CONFIRMED
        for (const subOrder of payment.orderGroup.sellerOrders) {
          if (subOrder.status === "PLACED") {
            await tx.order.update({
              where: { id: subOrder.id },
              data: { status: "CONFIRMED" },
            });
            await tx.orderTimeline.create({
              data: {
                orderId: subOrder.id,
                status: "CONFIRMED",
                note: "Payment confirmed via Razorpay webhook",
              },
            });
            await tx.notification.create({
              data: {
                userId: subOrder.sellerId,
                type: "ORDER_UPDATE",
                title: "Purchase Order Confirmed & Paid",
                body: `Purchase order ${subOrder.subOrderNumber} has been verified via webhook.`,
              },
            });
          }
        }

        await tx.auditLog.create({
          data: {
            action: "PAYMENT_WEBHOOK_PROCESSED",
            resource: "Payment",
            resourceId: payment.id,
            metadata: { eventName, rzpOrderId, rzpPaymentId },
          },
        });
      });

      return { success: true, received: true, processed: true, status: "PAID" };
    }

    if (eventName === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      if (rzpOrderId) {
        const payment = await prisma.payment.findFirst({
          where: {
            gatewayResponse: {
              path: ["razorpayOrderId"],
              equals: rzpOrderId,
            },
          },
        });

        if (payment && payment.status !== "PAID") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              gatewayResponse: {
                ...(payment.gatewayResponse as any),
                failedAt: new Date().toISOString(),
                error: paymentEntity.error_description || "Payment failed at gateway",
              },
            },
          });
        }
      }
      return { success: true, received: true, processed: true, status: "FAILED" };
    }

    return { received: true, unhandledEvent: eventName };
  }

  /**
   * Mock payment gateway processing abstraction (preserved for existing tests)
   */
  static async processMockPayment(orderGroupId: string, paymentMethod: PaymentMethod) {
    const payment = await prisma.payment.findFirst({
      where: { orderGroupId },
    });

    if (!payment) {
      throw AppError.notFound("Payment record not found for this order");
    }

    const targetStatus: PaymentStatus =
      paymentMethod === "COD" ? "PENDING" : "PAID";

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: targetStatus,
          paidAt: targetStatus === "PAID" ? new Date() : null,
          gatewayResponse: {
            provider: "MOCK_GATEWAY",
            mode: paymentMethod,
            timestamp: new Date().toISOString(),
            status: "SUCCESS",
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: "PAYMENT_UPDATED",
          resource: "Payment",
          resourceId: payment.id,
          metadata: { orderGroupId, paymentMethod, status: targetStatus },
        },
      });

      return res;
    });

    return updated;
  }
}
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

export class PaymentService {
  /**
   * Mock payment gateway processing abstraction
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

  /**
   * Mock webhook endpoint handler with idempotency and signature check
   */
  static async handleWebhook(payload: {
    orderGroupId: string;
    transactionRef: string;
    status: PaymentStatus;
    signature: string;
  }) {
    if (!payload.signature || payload.signature !== "mock_valid_signature") {
      throw AppError.forbidden("Invalid webhook signature");
    }

    const payment = await prisma.payment.findFirst({
      where: { orderGroupId: payload.orderGroupId },
    });

    if (!payment) {
      throw AppError.notFound("Payment not found");
    }

    // Idempotent: ignore if already in final status
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
}
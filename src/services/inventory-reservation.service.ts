import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma, ReservationStatus } from "@prisma/client";

export class InventoryReservationService {
  /**
   * 15-minute reservation duration
   */
  public static readonly RESERVATION_TTL_MS = 15 * 60 * 1000; // 15 mins

  /**
   * Create an inventory reservation with transactional row-level safety
   */
  static async createReservation(
    tx: Prisma.TransactionClient,
    productId: string,
    cartSessionId: string,
    quantity: number
  ) {
    if (quantity <= 0) {
      throw AppError.validation("Reservation quantity must be greater than zero");
    }

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        status: true,
        availableStock: true,
        reservedStock: true,
      },
    });

    if (!product || product.status !== "ACTIVE") {
      throw AppError.businessRule(
        `Product "${product?.title || productId}" is not available for purchase`
      );
    }

    // Calculate effective available stock
    const available = product.availableStock.toNumber();
    const reserved = product.reservedStock.toNumber();
    const netAvailable = available - reserved;

    if (quantity > netAvailable) {
      throw AppError.businessRule(
        `Insufficient available stock for "${product.title}". Requested: ${quantity}, Available: ${Math.max(0, netAvailable)}`
      );
    }

    const expiresAt = new Date(Date.now() + this.RESERVATION_TTL_MS);

    // Create reservation record
    const reservation = await tx.inventoryReservation.create({
      data: {
        productId,
        cartSessionId,
        quantity: new Prisma.Decimal(quantity),
        status: "ACTIVE",
        expiresAt,
      },
    });

    // Increment reservedStock
    await tx.product.update({
      where: { id: productId },
      data: {
        reservedStock: { increment: new Prisma.Decimal(quantity) },
      },
    });

    return reservation;
  }

  /**
   * Release an active reservation and restore available inventory
   */
  static async releaseReservation(
    tx: Prisma.TransactionClient,
    reservationId: string
  ) {
    const reservation = await tx.inventoryReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.status !== "ACTIVE") {
      return null;
    }

    const updated = await tx.inventoryReservation.update({
      where: { id: reservationId },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
      },
    });

    // Decrement reservedStock on product safely
    await tx.product.update({
      where: { id: reservation.productId },
      data: {
        reservedStock: { decrement: reservation.quantity },
      },
    });

    return updated;
  }

  /**
   * Convert an active reservation when order checkout is finalized.
   * Atomically decreases both availableStock and reservedStock.
   */
  static async convertReservation(
    tx: Prisma.TransactionClient,
    reservationId: string
  ) {
    const reservation = await tx.inventoryReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.status !== "ACTIVE") {
      throw AppError.businessRule("Reservation is no longer active or has expired");
    }

    const converted = await tx.inventoryReservation.update({
      where: { id: reservationId },
      data: { status: "CONVERTED" },
    });

    // Decrement availableStock and reservedStock permanently
    const product = await tx.product.update({
      where: { id: reservation.productId },
      data: {
        availableStock: { decrement: reservation.quantity },
        reservedStock: { decrement: reservation.quantity },
      },
    });

    // If stock hits zero, transition status to OUT_OF_STOCK
    if (product.availableStock.toNumber() <= 0) {
      await tx.product.update({
        where: { id: reservation.productId },
        data: { status: "OUT_OF_STOCK" },
      });
    }

    return converted;
  }

  /**
   * Idempotent sweep to expire all stale reservations past their TTL
   */
  static async expireStaleReservations() {
    const now = new Date();

    const stale = await prisma.inventoryReservation.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: now },
      },
      take: 100,
    });

    if (stale.length === 0) return { expiredCount: 0 };

    let count = 0;
    for (const res of stale) {
      await prisma.$transaction(async (tx) => {
        const current = await tx.inventoryReservation.findUnique({
          where: { id: res.id },
        });

        if (current && current.status === "ACTIVE") {
          await tx.inventoryReservation.update({
            where: { id: res.id },
            data: {
              status: "EXPIRED",
              releasedAt: new Date(),
            },
          });

          await tx.product.update({
            where: { id: res.productId },
            data: {
              reservedStock: { decrement: res.quantity },
            },
          });

          count++;
        }
      });
    }

    return { expiredCount: count };
  }
}
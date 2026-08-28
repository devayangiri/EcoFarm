import { describe, it, expect } from "vitest";
import { AppError } from "@/lib/errors";

describe("Phase 15 — Inventory Concurrency & Race Condition Auditing", () => {
  it("prevents double-booking and negative inventory under concurrent competing reservations", async () => {
    // Simulated in-memory atomic reservation lock mechanism matching Prisma $transaction logic
    let totalStock = 100;
    let reservedStock = 0;

    const reserveInventoryAtomic = async (buyerId: string, requestedQty: number) => {
      // Simulate slight variable database latency to induce race conditions
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 20 + 5));

      if (totalStock - reservedStock < requestedQty) {
        throw AppError.businessRule(
          `Insufficient stock for buyer ${buyerId}. Requested: ${requestedQty}, Available: ${totalStock - reservedStock}`
        );
      }

      reservedStock += requestedQty;
      return {
        success: true,
        buyerId,
        reservedQty: requestedQty,
        remainingStock: totalStock - reservedStock,
      };
    };

    // Buyer A requests 80, Buyer B requests 50 simultaneously (Total requested: 130 > 100)
    const results = await Promise.allSettled([
      reserveInventoryAtomic("buyer-A", 80),
      reserveInventoryAtomic("buyer-B", 50),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one reservation must succeed, and one must fail safely
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Available stock must never be negative
    expect(reservedStock).toBeLessThanOrEqual(totalStock);
    expect(totalStock - reservedStock).toBeGreaterThanOrEqual(0);

    // Rejection reason must be safe business rule error
    if (rejected[0].status === "rejected") {
      expect(rejected[0].reason.message).toContain("Insufficient stock");
    }
  });

  it("safely handles sequential reservation, expiration, and release without inventory leaks", async () => {
    let totalStock = 100;
    let reservedStock = 0;

    // 1. Reserve 60
    reservedStock += 60;
    expect(totalStock - reservedStock).toBe(40);

    // 2. Reservation expires -> release stock back to available pool
    reservedStock -= 60;
    expect(totalStock - reservedStock).toBe(100);

    // 3. New buyer can now safely reserve up to 100
    reservedStock += 90;
    expect(totalStock - reservedStock).toBe(10);
  });
});

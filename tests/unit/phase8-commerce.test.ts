import { describe, it, expect, vi, beforeEach } from "vitest";
import { CartService } from "@/services/cart.service";
import { CheckoutService } from "@/services/checkout.service";
import { ReviewService } from "@/services/review.service";
import { InventoryReservationService } from "@/services/inventory-reservation.service";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cart: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    inventoryReservation: {
      create: vi.fn(),
    },
    checkoutSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    orderItem: {
      findFirst: vi.fn(),
    },
    review: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => cb(prisma)),
  },
}));

vi.mock("@/services/inventory-reservation.service", () => ({
  InventoryReservationService: {
    RESERVATION_TTL_MS: 15 * 60 * 1000,
    expireStaleReservations: vi.fn().mockResolvedValue(0),
    createReservation: vi.fn().mockResolvedValue({ id: "res-1" }),
  },
}));

describe("Phase 8 Commerce Suite: Cart, Buy Now & Reviews", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Cart Item Count", () => {
    it("returns 0 if buyer has no active cart", async () => {
      (prisma.cart.findFirst as any).mockResolvedValue(null);
      const count = await CartService.getCartItemCount("buyer-1");
      expect(count).toBe(0);
    });

    it("returns count of items in active cart", async () => {
      (prisma.cart.findFirst as any).mockResolvedValue({
        items: [{ id: "item-1" }, { id: "item-2" }, { id: "item-3" }],
      });
      const count = await CartService.getCartItemCount("buyer-1");
      expect(count).toBe(3);
    });
  });

  describe("2. Buy Now (Direct Checkout)", () => {
    it("throws an error if product does not exist", async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);
      await expect(
        CheckoutService.initiateDirectCheckout("buyer-1", validUuid, 5)
      ).rejects.toThrow("Product not found");
    });

    it("creates isolated checkout cart and session without overwriting buyer active cart", async () => {
      const mockProduct = {
        id: validUuid,
        title: "Organic Rice",
        pricePerUnit: new Prisma.Decimal(50),
        minimumOrderQuantity: new Prisma.Decimal(2),
        availableStock: new Prisma.Decimal(100),
        reservedStock: new Prisma.Decimal(0),
        sellerId: "seller-1",
        status: "ACTIVE",
      };
      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);

      const mockCart = {
        id: "direct-cart-1",
        buyerId: "buyer-1",
        status: "CHECKOUT",
        items: [
          {
            id: "item-1",
            productId: validUuid,
            quantity: new Prisma.Decimal(5),
          },
        ],
      };
      (prisma.cart.create as any).mockResolvedValue(mockCart);
      (prisma.checkoutSession.create as any).mockResolvedValue({
        id: "chk-direct-123",
        cartId: "direct-cart-1",
        buyerId: "buyer-1",
        status: "INITIATED",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      const session = await CheckoutService.initiateDirectCheckout("buyer-1", validUuid, 5);
      expect(session).toBeDefined();
      expect(session.sessionId).toBe("chk-direct-123");
      expect(prisma.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            buyerId: "buyer-1",
            status: "CHECKOUT",
          }),
        })
      );
    });
  });

  describe("3. Reviews & Eligibility", () => {
    it("marks buyer not eligible if no delivered order exists", async () => {
      (prisma.review.findFirst as any).mockResolvedValue(null);
      (prisma.orderItem.findFirst as any).mockResolvedValue(null);
      const eligibility = await ReviewService.checkReviewEligibility("buyer-1", validUuid);
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.hasReviewed).toBe(false);
    });

    it("marks buyer not eligible if already reviewed", async () => {
      (prisma.review.findFirst as any).mockResolvedValue({ id: "rev-1", rating: 5 });

      const eligibility = await ReviewService.checkReviewEligibility("buyer-1", validUuid);
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.hasReviewed).toBe(true);
    });

    it("marks buyer eligible when delivered order exists and not yet reviewed", async () => {
      (prisma.review.findFirst as any).mockResolvedValue(null);
      (prisma.orderItem.findFirst as any).mockResolvedValue({
        id: "oi-1",
        order: { id: "ord-1", subOrderNumber: "ORD-001", status: "DELIVERED" },
      });

      const eligibility = await ReviewService.checkReviewEligibility("buyer-1", validUuid);
      expect(eligibility.isEligible).toBe(true);
      expect(eligibility.hasReviewed).toBe(false);
      expect(eligibility.orderNumber).toBe("ORD-001");
    });

    it("creates review if eligible and valid rating provided", async () => {
      (prisma.review.findFirst as any).mockResolvedValue(null);
      (prisma.orderItem.findFirst as any).mockResolvedValue({
        id: "oi-1",
        order: { id: "ord-1", subOrderNumber: "ORD-001", status: "DELIVERED" },
      });
      (prisma.product.findUnique as any).mockResolvedValue({
        id: validUuid,
        title: "Organic Rice",
        sellerId: "seller-1",
      });
      (prisma.review.create as any).mockResolvedValue({
        id: "rev-new",
        targetId: validUuid,
        authorId: "buyer-1",
        rating: 5,
        comment: "Excellent quality fresh harvest!",
      });

      const review = await ReviewService.createProductReview("buyer-1", {
        productId: validUuid,
        rating: 5,
        comment: "Excellent quality fresh harvest!",
      });

      expect(review.id).toBe("rev-new");
      expect(review.rating).toBe(5);
    });

    it("rejects review if rating is outside 1-5 range", async () => {
      await expect(
        ReviewService.createProductReview("buyer-1", {
          productId: validUuid,
          rating: 6,
          comment: "Invalid rating",
        })
      ).rejects.toThrow();
    });
  });
});

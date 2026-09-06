import { describe, it, expect, vi, beforeEach } from "vitest";
import { CartService } from "@/services/cart.service";
import { OrderService } from "@/services/order.service";
import { MarketplaceService } from "@/services/marketplace.service";
import { BuyerService } from "@/services/buyer.service";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    cart: {
      findFirst: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    orderGroup: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    orderTimeline: {
      create: vi.fn(),
    },
    payment: {
      updateMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    savedProduct: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }
      return callback;
    }),
  },
}));

describe("Buyer Cart State Sync & Safe Order Cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.savedProduct.findMany as any).mockResolvedValue([]);
  });

  // ----------------------------------------------------
  // 1. CART STATE SYNCHRONIZATION
  // ----------------------------------------------------
  describe("1. Cart State Synchronization", () => {
    it("getActiveCartProductIds returns active cart item product IDs", async () => {
      (prisma.cart.findFirst as any).mockResolvedValue({
        id: "cart-1",
        buyerId: "buyer-123",
        items: [
          { productId: "prod-100" },
          { productId: "prod-200" },
        ],
      });

      const productIds = await CartService.getActiveCartProductIds("buyer-123");
      expect(productIds).toEqual(["prod-100", "prod-200"]);
    });

    it("getActiveCartProductIds returns empty array when buyer has no cart", async () => {
      (prisma.cart.findFirst as any).mockResolvedValue(null);

      const productIds = await CartService.getActiveCartProductIds("buyer-456");
      expect(productIds).toEqual([]);
    });

    it("searchProducts attaches accurate isInCart flag for authenticated buyer", async () => {
      (prisma.product.findMany as any).mockResolvedValue([
        {
          id: "prod-100",
          title: "Organic Wheat",
          description: "High quality",
          pricePerUnit: new Prisma.Decimal(40),
          unit: "KG",
          availableStock: new Prisma.Decimal(100),
          minimumOrderQuantity: new Prisma.Decimal(10),
          status: "ACTIVE",
          sellerId: "farmer-1",
          seller: { id: "farmer-1", fullName: "Farmer Ram", state: "Punjab", district: "Ludhiana" },
          category: { id: "cat-1", name: "Grains" },
          images: [],
          certifications: [],
          ratings: [],
          updatedAt: new Date(),
        },
        {
          id: "prod-300",
          title: "Fresh Rice",
          description: "Premium",
          pricePerUnit: new Prisma.Decimal(60),
          unit: "KG",
          availableStock: new Prisma.Decimal(50),
          minimumOrderQuantity: new Prisma.Decimal(5),
          status: "ACTIVE",
          sellerId: "farmer-2",
          seller: { id: "farmer-2", fullName: "Farmer Shyam", state: "Haryana", district: "Karnal" },
          category: { id: "cat-1", name: "Grains" },
          images: [],
          certifications: [],
          ratings: [],
          updatedAt: new Date(),
        },
      ]);
      (prisma.product.count as any).mockResolvedValue(2);
      (prisma.cart.findFirst as any).mockResolvedValue({
        id: "cart-1",
        items: [{ productId: "prod-100" }],
      });

      const result = await MarketplaceService.searchProducts({}, 1, 10, "buyer-123");
      expect(result.items.length).toBe(2);
      expect(result.items[0].id).toBe("prod-100");
      expect(result.items[0].isInCart).toBe(true);
      expect(result.items[1].id).toBe("prod-300");
      expect(result.items[1].isInCart).toBe(false);
    });

    it("getProductDetails attaches isInCart true when product is in buyer cart", async () => {
      (prisma.product.findFirst as any).mockResolvedValue({
        id: "prod-100",
        title: "Organic Wheat",
        description: "High quality",
        pricePerUnit: new Prisma.Decimal(40),
        unit: "KG",
        availableStock: new Prisma.Decimal(100),
        reservedStock: new Prisma.Decimal(0),
        minimumOrderQuantity: new Prisma.Decimal(10),
        status: "ACTIVE",
        sellerId: "farmer-1",
        seller: {
          id: "farmer-1",
          fullName: "Farmer Ram",
          state: "Punjab",
          district: "Ludhiana",
          farmerProfile: { experienceYears: 10 },
          sellerProducts: [{ id: "p1" }],
          userVerifications: [{ status: "APPROVED" }],
        },
        category: { id: "cat-1", name: "Grains" },
        images: [],
        certifications: [],
        ratings: [],
        specifications: null,
      });

      (prisma.cart.findFirst as any).mockResolvedValue({
        id: "cart-1",
        items: [{ productId: "prod-100" }],
      });
      (prisma.cartItem.findFirst as any).mockResolvedValue({
        id: "ci-1",
        productId: "prod-100",
      });

      const product = await MarketplaceService.getProductDetails("prod-100", "buyer-123");
      expect(product.isInCart).toBe(true);
    });
  });

  // ----------------------------------------------------
  // 2. SAFE ORDER CANCELLATION
  // ----------------------------------------------------
  describe("2. Safe Order Cancellation", () => {
    it("successfully cancels sub-order in PLACED status and restores stock", async () => {
      const mockOrder = {
        id: "order-sub-1",
        subOrderNumber: "SUB-001",
        orderGroupId: "group-1",
        sellerId: "farmer-1",
        status: "PLACED",
        orderGroup: {
          id: "group-1",
          buyerId: "buyer-123",
          orderNumber: "GRP-001",
        },
        items: [
          {
            productId: "prod-100",
            quantity: new Prisma.Decimal(20),
          },
        ],
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.product.update as any).mockResolvedValue({
        id: "prod-100",
        availableStock: new Prisma.Decimal(120),
        status: "ACTIVE",
      });
      (prisma.order.update as any).mockResolvedValue({
        ...mockOrder,
        status: "CANCELLED_BY_BUYER",
      });
      (prisma.order.findMany as any).mockResolvedValue([
        { id: "order-sub-1", status: "CANCELLED_BY_BUYER" },
      ]);

      const result = await OrderService.cancelOrderByBuyer(
        "buyer-123",
        "order-sub-1",
        "Ordered incorrect variety by mistake"
      );

      expect(result.status).toBe("CANCELLED_BY_BUYER");

      // Verify product stock restoration
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prod-100" },
          data: { availableStock: { increment: expect.anything() } },
        })
      );

      // Verify timeline record
      expect(prisma.orderTimeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: "order-sub-1",
            status: "CANCELLED_BY_BUYER",
            actorId: "buyer-123",
          }),
        })
      );

      // Verify notifications
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);

      // Verify OrderGroup transitioned to CANCELLED and COD payment cancelled
      expect(prisma.orderGroup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "group-1" },
          data: { status: "CANCELLED" },
        })
      );
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderGroupId: "group-1", status: "PENDING" },
          data: { status: "CANCELLED" },
        })
      );
    });

    it("revives OUT_OF_STOCK product to ACTIVE upon order cancellation stock restoration", async () => {
      const mockOrder = {
        id: "order-sub-2",
        subOrderNumber: "SUB-002",
        orderGroupId: "group-2",
        sellerId: "farmer-1",
        status: "CONFIRMED",
        orderGroup: {
          id: "group-2",
          buyerId: "buyer-123",
          orderNumber: "GRP-002",
        },
        items: [
          {
            productId: "prod-oos",
            quantity: new Prisma.Decimal(50),
          },
        ],
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      // First update increments stock, returns OUT_OF_STOCK status with new positive stock
      (prisma.product.update as any)
        .mockResolvedValueOnce({
          id: "prod-oos",
          availableStock: new Prisma.Decimal(50),
          status: "OUT_OF_STOCK",
        })
        .mockResolvedValueOnce({
          id: "prod-oos",
          status: "ACTIVE",
        });

      (prisma.order.update as any).mockResolvedValue({
        ...mockOrder,
        status: "CANCELLED_BY_BUYER",
      });
      (prisma.order.findMany as any).mockResolvedValue([
        { id: "order-sub-2", status: "CANCELLED_BY_BUYER" },
      ]);

      await OrderService.cancelOrderByBuyer(
        "buyer-123",
        "order-sub-2",
        "Found alternate supplier"
      );

      // Verify revival to ACTIVE
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-oos" },
        data: { status: "ACTIVE" },
      });
    });

    it("rejects cancellation when order status is PROCESSING (fulfillment started)", async () => {
      const mockOrder = {
        id: "order-sub-3",
        subOrderNumber: "SUB-003",
        status: "PROCESSING",
        orderGroup: {
          id: "group-3",
          buyerId: "buyer-123",
        },
        items: [],
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.cancelOrderByBuyer("buyer-123", "order-sub-3", "Want to cancel")
      ).rejects.toThrow(/cannot be cancelled because fulfillment has already begun/i);
    });

    it("rejects cancellation when order status is SHIPPED", async () => {
      const mockOrder = {
        id: "order-sub-4",
        subOrderNumber: "SUB-004",
        status: "SHIPPED",
        orderGroup: {
          id: "group-4",
          buyerId: "buyer-123",
        },
        items: [],
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.cancelOrderByBuyer("buyer-123", "order-sub-4", "Want to cancel")
      ).rejects.toThrow(/cannot be cancelled because fulfillment has already begun/i);
    });

    it("rejects cancellation when order is already cancelled (double-cancellation prevention)", async () => {
      const mockOrder = {
        id: "order-sub-5",
        subOrderNumber: "SUB-005",
        status: "CANCELLED_BY_BUYER",
        orderGroup: {
          id: "group-5",
          buyerId: "buyer-123",
        },
        items: [],
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.cancelOrderByBuyer("buyer-123", "order-sub-5", "Cancel again")
      ).rejects.toThrow(/already been cancelled/i);
    });

    it("rejects cancellation when buyer does not own the order", async () => {
      const mockOrder = {
        id: "order-sub-6",
        subOrderNumber: "SUB-006",
        status: "PLACED",
        orderGroup: {
          id: "group-6",
          buyerId: "other-buyer",
        },
        items: [],
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.cancelOrderByBuyer("buyer-123", "order-sub-6", "Cancel attempt")
      ).rejects.toThrow(/do not have permission/i);
    });

    it("multi-vendor scoping: cancelling one sub-order does not cancel sibling sub-order", async () => {
      const mockOrder = {
        id: "order-sub-alice",
        subOrderNumber: "SUB-ALICE",
        orderGroupId: "group-multi",
        sellerId: "farmer-alice",
        status: "PLACED",
        orderGroup: {
          id: "group-multi",
          buyerId: "buyer-123",
          orderNumber: "GRP-MULTI",
        },
        items: [{ productId: "prod-alice", quantity: new Prisma.Decimal(10) }],
      };

      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.product.update as any).mockResolvedValue({
        id: "prod-alice",
        availableStock: new Prisma.Decimal(100),
        status: "ACTIVE",
      });
      (prisma.order.update as any).mockResolvedValue({
        ...mockOrder,
        status: "CANCELLED_BY_BUYER",
      });
      // Sibling order from Bob is still CONFIRMED
      (prisma.order.findMany as any).mockResolvedValue([
        { id: "order-sub-alice", status: "CANCELLED_BY_BUYER" },
        { id: "order-sub-bob", status: "CONFIRMED" },
      ]);

      await OrderService.cancelOrderByBuyer(
        "buyer-123",
        "order-sub-alice",
        "Cancelled Alice portion"
      );

      // OrderGroup should NOT be cancelled since Bob's order is still active
      expect(prisma.orderGroup.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "group-multi" },
          data: { status: "CANCELLED" },
        })
      );
      // COD payment should NOT be cancelled
      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });
  });
});

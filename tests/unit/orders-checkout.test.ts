import { describe, it, expect, vi, beforeEach } from "vitest";
import { CartService } from "@/services/cart.service";
import { CheckoutService } from "@/services/checkout.service";
import { OrderService } from "@/services/order.service";
import { InventoryReservationService } from "@/services/inventory-reservation.service";
import { PaymentService } from "@/services/payment.service";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Mock Prisma Client
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
      deleteMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    inventoryReservation: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    checkoutSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderGroup: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    orderTimeline: {
      create: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => {
      if (typeof callback === "function") {
        return callback(prisma);
      }
      return callback;
    }),
  },
}));

describe("Phase 7: Multi-Vendor Orders, Checkout & Inventory Reservation Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------
  // 1. CART SERVICE & SECURITY
  // ----------------------------------------------------
  describe("1. CartService & Validation Rules", () => {
    it("should reject adding product below Minimum Order Quantity (MOQ)", async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        id: "prod-1",
        title: "Basmati Rice 1121",
        sellerId: "farmer-1",
        status: "ACTIVE",
        pricePerUnit: new Prisma.Decimal(65),
        minimumOrderQuantity: new Prisma.Decimal(50),
        availableStock: new Prisma.Decimal(500),
      });

      await expect(
        CartService.addToCart("buyer-1", {
          productId: "prod-1",
          quantity: 20, // below 50 MOQ
        })
      ).rejects.toThrow(/Minimum order quantity/);
    });

    it("should reject adding product when quantity exceeds available stock", async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        id: "prod-1",
        title: "Basmati Rice 1121",
        sellerId: "farmer-1",
        status: "ACTIVE",
        pricePerUnit: new Prisma.Decimal(65),
        minimumOrderQuantity: new Prisma.Decimal(10),
        availableStock: new Prisma.Decimal(100),
      });

      await expect(
        CartService.addToCart("buyer-1", {
          productId: "prod-1",
          quantity: 250, // exceeds 100
        })
      ).rejects.toThrow(/exceeds available stock/);
    });

    it("should prevent a farmer from buying their own listed product", async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        id: "prod-1",
        title: "Basmati Rice 1121",
        sellerId: "user-same-id",
        status: "ACTIVE",
        pricePerUnit: new Prisma.Decimal(65),
        minimumOrderQuantity: new Prisma.Decimal(10),
        availableStock: new Prisma.Decimal(100),
      });

      await expect(
        CartService.addToCart("user-same-id", {
          productId: "prod-1",
          quantity: 15,
        })
      ).rejects.toThrow(/You cannot buy your own product listing/);
    });

    it("should enforce buyer ownership when updating or deleting cart items (IDOR protection)", async () => {
      (prisma.cartItem.findUnique as any).mockResolvedValue({
        id: "item-123",
        cart: { buyerId: "buyer-legit" },
        product: { minimumOrderQuantity: new Prisma.Decimal(1), availableStock: new Prisma.Decimal(100) },
      });

      await expect(
        CartService.updateCartItem("buyer-attacker", "item-123", 5)
      ).rejects.toThrow(/permission/);

      await expect(
        CartService.removeCartItem("buyer-attacker", "item-123")
      ).rejects.toThrow(/permission/);
    });
  });

  // ----------------------------------------------------
  // 2. INVENTORY RESERVATION ENGINE
  // ----------------------------------------------------
  describe("2. InventoryReservationService", () => {
    it("should fail reservation if requested quantity > net available stock", async () => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            id: "prod-1",
            title: "Live Rohu Fingerlings",
            status: "ACTIVE",
            availableStock: new Prisma.Decimal(100),
            reservedStock: new Prisma.Decimal(80), // only 20 net available
          }),
        },
      };

      await expect(
        InventoryReservationService.createReservation(
          mockTx as any,
          "prod-1",
          "sess-1",
          35
        )
      ).rejects.toThrow(/Insufficient available stock/);
    });

    it("should successfully create 15-minute reservation and increment reservedStock", async () => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            id: "prod-1",
            title: "Organic Potatoes",
            status: "ACTIVE",
            availableStock: new Prisma.Decimal(200),
            reservedStock: new Prisma.Decimal(0),
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        inventoryReservation: {
          create: vi.fn().mockResolvedValue({
            id: "res-1",
            productId: "prod-1",
            status: "ACTIVE",
          }),
        },
      };

      const res = await InventoryReservationService.createReservation(
        mockTx as any,
        "prod-1",
        "sess-1",
        50
      );

      expect(res.id).toBe("res-1");
      expect(mockTx.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prod-1" },
          data: expect.objectContaining({
            reservedStock: { increment: expect.any(Object) },
          }),
        })
      );
    });
  });

  // ----------------------------------------------------
  // 3. MULTI-VENDOR ORDER CREATION & ATOMIC CHECKOUT
  // ----------------------------------------------------
  describe("3. Multi-Vendor Order Creation & Checkout Session", () => {
    it("should generate valid order numbers with proper prefixes", () => {
      const orderNum = CheckoutService.generateOrderNumber();
      expect(orderNum).toMatch(/^AG-ORD-\d{8}-[A-Z0-9]{4}$/);

      const subOrderNum = CheckoutService.generateSubOrderNumber(orderNum, 0);
      expect(subOrderNum).toMatch(/^AG-SUB-\d{8}-[A-Z0-9]{4}-1$/);
    });

    it("should reject checkout confirmation if session has expired", async () => {
      (prisma.checkoutSession.findUnique as any).mockResolvedValue({
        id: "sess-expired",
        buyerId: "buyer-1",
        status: "ACTIVE",
        expiresAt: new Date(Date.now() - 60000), // expired 1 min ago
        cart: { items: [] },
      });

      await expect(
        CheckoutService.confirmCheckout("buyer-1", {
          checkoutSessionId: "sess-expired",
          paymentMethod: "COD",
          shippingAddress: {
            recipientName: "Test Buyer",
            recipientPhone: "+919876543210",
            villageOrStreet: "Sector 5",
            cityOrTown: "Kolkata",
            district: "Kolkata",
            state: "West Bengal",
            pincode: "700001",
          },
        })
      ).rejects.toThrow(/expired/);
    });
  });

  // ----------------------------------------------------
  // 4. ORDER STATE MACHINE & TIMELINE
  // ----------------------------------------------------
  describe("4. Order State Machine & Fulfillment Transitions", () => {
    it("should allow valid progressive transitions (PLACED -> CONFIRMED -> PROCESSING)", async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: "ord-1",
        sellerId: "farmer-1",
        orderGroupId: "group-1",
        status: "PLACED",
        orderGroup: { buyerId: "buyer-1" },
        items: [],
      });

      (prisma.order.findMany as any).mockResolvedValue([{ status: "CONFIRMED" }]);

      const updated = await OrderService.updateSellerOrderStatus(
        "farmer-1",
        "ord-1",
        { status: "CONFIRMED", note: "Accepted harvest order" }
      );

      expect(prisma.orderTimeline.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "ORDER_STATUS_UPDATED",
          }),
        })
      );
    });

    it("should reject illegal backwards or skipped status transitions", async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: "ord-1",
        sellerId: "farmer-1",
        status: "SHIPPED",
        orderGroup: { buyerId: "buyer-1" },
      });

      await expect(
        OrderService.updateSellerOrderStatus("farmer-1", "ord-1", {
          status: "PLACED", // illegal backwards transition
        })
      ).rejects.toThrow(/Invalid status transition/);
    });
  });

  // ----------------------------------------------------
  // 5. PAYMENT SERVICE & WEBHOOK IDEMPOTENCY
  // ----------------------------------------------------
  describe("5. Payment Service & Webhook Processing", () => {
    it("should reject webhook with invalid signature", async () => {
      await expect(
        PaymentService.handleWebhook({
          orderGroupId: "grp-1",
          transactionRef: "tx-123",
          status: "PAID",
          signature: "invalid_sig",
        })
      ).rejects.toThrow(/signature/);
    });

    it("should idempotently handle duplicate payment webhook events", async () => {
      (prisma.payment.findFirst as any).mockResolvedValue({
        id: "pay-1",
        status: "PAID", // already paid
      });

      const res = await PaymentService.handleWebhook({
        orderGroupId: "grp-1",
        transactionRef: "tx-123",
        status: "PAID",
        signature: "mock_valid_signature",
      });

      expect(res.alreadyProcessed).toBe(true);
    });
  });
});
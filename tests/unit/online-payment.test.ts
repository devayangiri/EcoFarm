import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { RazorpayClient } from "@/lib/razorpay";
import { PaymentService } from "@/services/payment.service";
import { CheckoutService } from "@/services/checkout.service";
import crypto from "crypto";

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    checkoutSession: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    orderGroup: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
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
    inventoryReservation: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
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

describe("Phase 8: Production-Ready Razorpay Online Payment & Security Suite", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    process.env.RAZORPAY_KEY_ID = "rzp_test_mockKey123";
    process.env.RAZORPAY_KEY_SECRET = "mockSecretKey456789";
    process.env.RAZORPAY_WEBHOOK_SECRET = "mockWebhookSecret987";
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  // =========================================================================
  // 1. GATEWAY CONFIGURATION & ENVIRONMENT SECURITY
  // =========================================================================
  describe("1. Gateway Configuration & Secret Isolation", () => {
    it("should report gateway configured when valid credentials exist", () => {
      expect(RazorpayClient.isConfigured()).toBe(true);
      expect(RazorpayClient.getKeyId()).toBe("rzp_test_mockKey123");
    });

    it("should safely report gateway unconfigured when credentials are empty", () => {
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      expect(RazorpayClient.isConfigured()).toBe(false);
      expect(RazorpayClient.getKeyId()).toBeNull();
    });

    it("should return client-safe config without exposing gateway or webhook secrets", () => {
      const config = PaymentService.getPaymentConfig();
      expect(config.enabled).toBe(true);
      expect(config.keyId).toBe("rzp_test_mockKey123");
      expect((config as any).keySecret).toBeUndefined();
      expect((config as any).webhookSecret).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. CRYPTOGRAPHIC SIGNATURE VERIFICATION (HMAC-SHA256)
  // =========================================================================
  describe("2. Cryptographic HMAC-SHA256 Signature Verification", () => {
    it("should successfully verify genuine Razorpay payment signature", () => {
      const orderId = "order_N123456789";
      const paymentId = "pay_P987654321";
      const expectedSignature = crypto
        .createHmac("sha256", "mockSecretKey456789")
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = RazorpayClient.verifyPaymentSignature(orderId, paymentId, expectedSignature);
      expect(isValid).toBe(true);
    });

    it("should reject tampered or forged payment signatures", () => {
      const orderId = "order_N123456789";
      const paymentId = "pay_P987654321";
      const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      const isValid = RazorpayClient.verifyPaymentSignature(orderId, paymentId, forgedSignature);
      expect(isValid).toBe(false);
    });

    it("should verify authentic Razorpay webhook signature from raw request body", () => {
      const rawBody = JSON.stringify({
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_123", amount: 50000 } } },
      });
      const validSignature = crypto
        .createHmac("sha256", "mockWebhookSecret987")
        .update(rawBody)
        .digest("hex");

      const isValid = RazorpayClient.verifyWebhookSignature(rawBody, validSignature);
      expect(isValid).toBe(true);
    });

    it("should reject tampered raw webhook body even if signature was for original body", () => {
      const originalBody = JSON.stringify({ event: "payment.captured", amount: 50000 });
      const tamperedBody = JSON.stringify({ event: "payment.captured", amount: 1000 });
      const signature = crypto
        .createHmac("sha256", "mockWebhookSecret987")
        .update(originalBody)
        .digest("hex");

      const isValid = RazorpayClient.verifyWebhookSignature(tamperedBody, signature);
      expect(isValid).toBe(false);
    });
  });

  // =========================================================================
  // 3. SERVER-AUTHORITATIVE PAYMENT ORDER CREATION
  // =========================================================================
  describe("3. Server-Authoritative Payment Order Creation", () => {
    const mockShippingAddress = {
      recipientName: "Test Buyer",
      recipientPhone: "+919876543210",
      villageOrStreet: "Sector 5",
      cityOrTown: "Kolkata",
      district: "Kolkata",
      state: "West Bengal",
      pincode: "700001",
    };

    it("should reject creation if Razorpay gateway is not configured", async () => {
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;

      await expect(
        PaymentService.createOnlinePaymentOrder("buyer-1", {
          checkoutSessionId: "sess-1",
          shippingAddress: mockShippingAddress,
        })
      ).rejects.toThrow(/not configured/i);
    });

    it("should reject order creation if session is not found or belongs to another buyer", async () => {
      (prisma.checkoutSession.findUnique as any).mockResolvedValue(null);

      await expect(
        PaymentService.createOnlinePaymentOrder("buyer-1", {
          checkoutSessionId: "sess-1",
          shippingAddress: mockShippingAddress,
        })
      ).rejects.toThrow(/not found/i);

      (prisma.checkoutSession.findUnique as any).mockResolvedValue({
        id: "sess-1",
        buyerId: "other-buyer",
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 600000),
      });

      await expect(
        PaymentService.createOnlinePaymentOrder("buyer-1", {
          checkoutSessionId: "sess-1",
          shippingAddress: mockShippingAddress,
        })
      ).rejects.toThrow(/permission/i);
    });

    it("should reject order creation if checkout session is expired", async () => {
      (prisma.checkoutSession.findUnique as any).mockResolvedValue({
        id: "sess-1",
        buyerId: "buyer-1",
        status: "ACTIVE",
        expiresAt: new Date(Date.now() - 5000), // expired in past
      });

      await expect(
        PaymentService.createOnlinePaymentOrder("buyer-1", {
          checkoutSessionId: "sess-1",
          shippingAddress: mockShippingAddress,
        })
      ).rejects.toThrow(/expired/i);
    });

    it("should enforce server-authoritative amount in paise (never trusting client)", async () => {
      const session = {
        id: "sess-1",
        buyerId: "buyer-1",
        status: "ACTIVE",
        totalAmount: new Prisma.Decimal(1250.75),
        expiresAt: new Date(Date.now() + 600000),
        cart: {
          items: [
            {
              id: "item-1",
              productId: "prod-1",
              sellerId: "farmer-1",
              quantity: new Prisma.Decimal(10),
              product: {
                id: "prod-1",
                title: "Organic Rice",
                unit: "kg",
                pricePerUnit: new Prisma.Decimal(100),
              },
            },
          ],
        },
      };

      (prisma.checkoutSession.findUnique as any).mockResolvedValue(session);
      (prisma.orderGroup.create as any).mockResolvedValue({
        id: "grp-1",
        orderNumber: "AG-ORD-20260907-TEST",
        totalAmount: session.totalAmount,
      });
      (prisma.order.create as any).mockResolvedValue({ id: "ord-1" });
      (prisma.orderItem.create as any).mockResolvedValue({ id: "item-1" });
      (prisma.orderTimeline.create as any).mockResolvedValue({ id: "tml-1" });
      (prisma.checkoutSession.update as any).mockResolvedValue({ id: "sess-1" });
      (prisma.payment.create as any).mockResolvedValue({ id: "pay-1" });
      (prisma.payment.findFirst as any).mockResolvedValue({ id: "pay-1" });
      (prisma.payment.update as any).mockResolvedValue({ id: "pay-1" });

      // Mock fetch for Razorpay API call
      const globalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "order_mockRzpOrder123",
          amount: 125075,
          currency: "INR",
          status: "created",
        }),
      });

      try {
        const result = await PaymentService.createOnlinePaymentOrder("buyer-1", {
          checkoutSessionId: "sess-1",
          shippingAddress: mockShippingAddress,
        });

        expect(result.amount).toBe(125075); // Exactly 1250.75 * 100 paise
        expect(result.currency).toBe("INR");
        expect(result.razorpayOrderId).toBe("order_mockRzpOrder123");
        expect(result.keyId).toBe("rzp_test_mockKey123");

        // Verify Payment is created as PENDING, NOT PAID
        expect(prisma.payment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: "PENDING",
              paymentMethod: "RAZORPAY",
            }),
          })
        );
      } finally {
        global.fetch = globalFetch;
      }
    });
  });

  // =========================================================================
  // 4. PAYMENT VERIFICATION & FULFILLMENT TRANSITIONS
  // =========================================================================
  describe("4. Payment Verification & Fulfillment Invariants", () => {
    it("should reject verification if required signature parameters are missing", async () => {
      await expect(
        PaymentService.verifyOnlinePayment("buyer-1", {
          orderGroupId: "grp-1",
          razorpayOrderId: "",
          razorpayPaymentId: "pay_123",
          razorpaySignature: "sig_123",
        })
      ).rejects.toThrow(/Missing required/);
    });

    it("should reject verification if payment belongs to a different buyer", async () => {
      (prisma.payment.findFirst as any).mockResolvedValue({
        id: "pay-1",
        orderGroup: { buyerId: "buyer-different" },
      });

      await expect(
        PaymentService.verifyOnlinePayment("buyer-1", {
          orderGroupId: "grp-1",
          razorpayOrderId: "order_123",
          razorpayPaymentId: "pay_123",
          razorpaySignature: "sig_123",
        })
      ).rejects.toThrow(/permission/);
    });

    it("should reject verification if gateway order ID does not match server record", async () => {
      (prisma.payment.findFirst as any).mockResolvedValue({
        id: "pay-1",
        status: "PENDING",
        orderGroup: { buyerId: "buyer-1" },
        gatewayResponse: { razorpayOrderId: "order_recorded_server" },
      });

      await expect(
        PaymentService.verifyOnlinePayment("buyer-1", {
          orderGroupId: "grp-1",
          razorpayOrderId: "order_tampered_client",
          razorpayPaymentId: "pay_123",
          razorpaySignature: "sig_123",
        })
      ).rejects.toThrow(/order mismatch/i);
    });

    it("should record FAILED payment status and reject if signature verification fails", async () => {
      (prisma.payment.findFirst as any).mockResolvedValue({
        id: "pay-1",
        status: "PENDING",
        orderGroup: { buyerId: "buyer-1" },
        gatewayResponse: { razorpayOrderId: "order_123" },
      });
      (prisma.payment.update as any).mockResolvedValue({ id: "pay-1" });

      await expect(
        PaymentService.verifyOnlinePayment("buyer-1", {
          orderGroupId: "grp-1",
          razorpayOrderId: "order_123",
          razorpayPaymentId: "pay_123",
          razorpaySignature: "invalid_forged_signature",
        })
      ).rejects.toThrow(/signature verification failed/i);

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "pay-1" },
          data: expect.objectContaining({
            status: "FAILED",
          }),
        })
      );
    });

    it("should idempotently return already processed if payment is already PAID", async () => {
      (prisma.payment.findFirst as any).mockResolvedValue({
        id: "pay-1",
        status: "PAID",
        orderGroup: {
          buyerId: "buyer-1",
          orderNumber: "AG-ORD-ALREADY-PAID",
        },
        gatewayResponse: { razorpayOrderId: "order_123" },
      });

      const res = await PaymentService.verifyOnlinePayment("buyer-1", {
        orderGroupId: "grp-1",
        razorpayOrderId: "order_123",
        razorpayPaymentId: "pay_123",
        razorpaySignature: "any_signature",
      });

      expect(res.alreadyProcessed).toBe(true);
      expect(res.status).toBe("PAID");
      expect(res.orderNumber).toBe("AG-ORD-ALREADY-PAID");
    });

    it("should atomically confirm seller orders, mark Payment PAID, preserve OrderGroup PAYMENT_PENDING, and convert reservations", async () => {
      const orderId = "order_valid_123";
      const paymentId = "pay_valid_456";
      const validSignature = crypto
        .createHmac("sha256", "mockSecretKey456789")
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const mockOrderGroup = {
        id: "grp-1",
        orderNumber: "AG-ORD-20260907-CONFIRM",
        buyerId: "buyer-1",
        status: "PAYMENT_PENDING",
        sellerOrders: [
          { id: "sub-1", sellerId: "farmer-1", status: "PLACED" },
          { id: "sub-2", sellerId: "farmer-2", status: "PLACED" },
        ],
      };

      (prisma.payment.findFirst as any).mockResolvedValue({
        id: "pay-1",
        status: "PENDING",
        amount: new Prisma.Decimal(3500),
        orderGroup: mockOrderGroup,
        gatewayResponse: { razorpayOrderId: orderId },
      });

      (prisma.payment.update as any).mockResolvedValue({ id: "pay-1", status: "PAID" });
      (prisma.order.update as any).mockResolvedValue({ id: "sub-1", status: "CONFIRMED" });
      (prisma.orderTimeline.create as any).mockResolvedValue({ id: "tml-1" });
      (prisma.checkoutSession.findFirst as any).mockResolvedValue({
        id: "sess-1",
        cartId: "cart-1",
      });
      (prisma.checkoutSession.update as any).mockResolvedValue({ id: "sess-1" });
      (prisma.inventoryReservation.findMany as any).mockResolvedValue([
        { id: "res-1", productId: "prod-1", quantity: new Prisma.Decimal(10) },
      ]);
      (prisma.inventoryReservation.findUnique as any).mockResolvedValue({
        id: "res-1",
        productId: "prod-1",
        quantity: new Prisma.Decimal(10),
        status: "ACTIVE",
      });
      (prisma.inventoryReservation.update as any).mockResolvedValue({ id: "res-1" });
      (prisma.product.update as any).mockResolvedValue({
        id: "prod-1",
        availableStock: new Prisma.Decimal(90),
      });
      (prisma.cartItem.deleteMany as any).mockResolvedValue({ count: 2 });
      (prisma.notification.create as any).mockResolvedValue({ id: "notif-1" });
      (prisma.user.findMany as any).mockResolvedValue([{ id: "admin-1" }]);
      (prisma.auditLog.create as any).mockResolvedValue({ id: "audit-1" });

      const result = await PaymentService.verifyOnlinePayment("buyer-1", {
        orderGroupId: "grp-1",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("PAID");

      // Verify Payment marked PAID
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "pay-1" },
          data: expect.objectContaining({
            status: "PAID",
            transactionRef: paymentId,
          }),
        })
      );

      // Verify seller sub-orders moved to CONFIRMED
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-1" },
          data: expect.objectContaining({ status: "CONFIRMED" }),
        })
      );
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sub-2" },
          data: expect.objectContaining({ status: "CONFIRMED" }),
        })
      );

      // Verify OrderGroup status is NOT updated to PROCESSING (fulfillment hasn't started)
      expect(prisma.orderGroup.update).not.toHaveBeenCalled();

      // Verify Buyer and Admin notifications dispatched
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "buyer-1",
            type: "PAYMENT_UPDATE",
          }),
        })
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "admin-1",
            type: "ORDER_UPDATE",
          }),
        })
      );
    });
  });

  // =========================================================================
  // 5. WEBHOOK PROCESSING & IDEMPOTENCY
  // =========================================================================
  describe("5. Razorpay Webhooks & Event Processing", () => {
    it("should reject webhook request if signature is invalid", async () => {
      const rawBody = JSON.stringify({ event: "payment.captured" });
      await expect(
        PaymentService.handleWebhook(rawBody, "invalid_webhook_signature")
      ).rejects.toThrow(/signature/i);
    });

    it("should process payment.captured webhook and advance status to PAID", async () => {
      const rzpOrderId = "order_rzp_webhook_123";
      const rzpPaymentId = "pay_rzp_webhook_456";
      const rawBody = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: rzpPaymentId,
              order_id: rzpOrderId,
              amount: 500000,
              status: "captured",
            },
          },
        },
      });

      const signature = crypto
        .createHmac("sha256", "mockWebhookSecret987")
        .update(rawBody)
        .digest("hex");

      (prisma.payment.findFirst as any).mockResolvedValue({
        id: "pay-1",
        status: "PENDING",
        amount: new Prisma.Decimal(5000),
        orderGroup: {
          id: "grp-1",
          orderNumber: "AG-ORD-WH-001",
          buyerId: "buyer-1",
          sellerOrders: [{ id: "sub-1", sellerId: "farmer-1", status: "PLACED" }],
        },
      });
      (prisma.payment.update as any).mockResolvedValue({ id: "pay-1", status: "PAID" });
      (prisma.order.update as any).mockResolvedValue({ id: "sub-1" });
      (prisma.orderTimeline.create as any).mockResolvedValue({ id: "tml-1" });
      (prisma.checkoutSession.findFirst as any).mockResolvedValue(null);
      (prisma.notification.create as any).mockResolvedValue({ id: "notif-1" });
      (prisma.auditLog.create as any).mockResolvedValue({ id: "audit-1" });

      const res = await PaymentService.handleWebhook(rawBody, signature);
      expect(res.success).toBe(true);
      expect(res.status).toBe("PAID");
    });

    it("should idempotently ignore duplicate webhook events when payment is already PAID", async () => {
      const rawBody = JSON.stringify({
        event: "order.paid",
        payload: {
          order: {
            entity: {
              id: "order_already_paid",
              amount: 25000,
            },
          },
        },
      });

      const signature = crypto
        .createHmac("sha256", "mockWebhookSecret987")
        .update(rawBody)
        .digest("hex");

      (prisma.payment.findFirst as any).mockResolvedValue({
        id: "pay-1",
        status: "PAID", // Already processed!
      });

      const res = await PaymentService.handleWebhook(rawBody, signature);
      expect(res.alreadyProcessed).toBe(true);
    });

    it("should update payment status to FAILED on payment.failed webhook event", async () => {
      const rawBody = JSON.stringify({
        event: "payment.failed",
        payload: {
          payment: {
            entity: {
              id: "pay_failed_123",
              order_id: "order_failed_123",
              error_description: "Card expired",
            },
          },
        },
      });

      const signature = crypto
        .createHmac("sha256", "mockWebhookSecret987")
        .update(rawBody)
        .digest("hex");

      (prisma.payment.findFirst as any).mockResolvedValue({
        id: "pay-1",
        status: "PENDING",
      });
      (prisma.payment.update as any).mockResolvedValue({ id: "pay-1", status: "FAILED" });
      (prisma.auditLog.create as any).mockResolvedValue({ id: "audit-1" });

      const res = await PaymentService.handleWebhook(rawBody, signature);
      expect(res.success).toBe(true);
      expect(res.status).toBe("FAILED");
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "pay-1" },
          data: expect.objectContaining({ status: "FAILED" }),
        })
      );
    });
  });

  // =========================================================================
  // 6. MULTI-VENDOR ISOLATION & COD / BANK TRANSFER NON-REGRESSION
  // =========================================================================
  describe("6. Multi-Vendor Isolation & COD/Bank Transfer Non-Regression", () => {
    it("should ensure exactly 1 Razorpay Order per multi-vendor checkout while isolating seller orders", async () => {
      const session = {
        id: "sess-mv",
        buyerId: "buyer-1",
        status: "ACTIVE",
        totalAmount: new Prisma.Decimal(5500),
        expiresAt: new Date(Date.now() + 600000),
        cart: {
          items: [
            {
              id: "it-1",
              productId: "prod-1",
              sellerId: "farmer-A",
              quantity: new Prisma.Decimal(50),
              product: { id: "prod-1", title: "Apples", unit: "kg", pricePerUnit: new Prisma.Decimal(60) },
            },
            {
              id: "it-2",
              productId: "prod-2",
              sellerId: "farmer-B",
              quantity: new Prisma.Decimal(20),
              product: { id: "prod-2", title: "Honey", unit: "kg", pricePerUnit: new Prisma.Decimal(125) },
            },
          ],
        },
      };

      (prisma.checkoutSession.findUnique as any).mockResolvedValue(session);
      (prisma.orderGroup.create as any).mockResolvedValue({
        id: "grp-mv",
        orderNumber: "AG-ORD-MV-001",
        totalAmount: session.totalAmount,
      });
      (prisma.order.create as any)
        .mockResolvedValueOnce({ id: "ord-A", sellerId: "farmer-A" })
        .mockResolvedValueOnce({ id: "ord-B", sellerId: "farmer-B" });
      (prisma.orderItem.create as any).mockResolvedValue({ id: "item-x" });
      (prisma.orderTimeline.create as any).mockResolvedValue({ id: "tml-x" });
      (prisma.checkoutSession.update as any).mockResolvedValue({ id: "sess-mv" });
      (prisma.payment.create as any).mockResolvedValue({ id: "pay-mv" });
      (prisma.payment.findFirst as any).mockResolvedValue({ id: "pay-mv" });
      (prisma.payment.update as any).mockResolvedValue({ id: "pay-mv" });

      const globalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "order_mv_rzp_123",
          amount: 550000,
          currency: "INR",
          status: "created",
        }),
      });

      try {
        const result = await PaymentService.createOnlinePaymentOrder("buyer-1", {
          checkoutSessionId: "sess-mv",
          shippingAddress: {
            recipientName: "Buyer MV",
            recipientPhone: "+919876543210",
            villageOrStreet: "Plot 10",
            cityOrTown: "Kolkata",
            district: "Kolkata",
            state: "West Bengal",
            pincode: "700001",
          },
        });

        // Exactly one gateway order created
        expect(result.razorpayOrderId).toBe("order_mv_rzp_123");
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Two sub-orders created for two distinct farmers
        expect(prisma.order.create).toHaveBeenCalledTimes(2);
      } finally {
        global.fetch = globalFetch;
      }
    });

    it("should preserve Cash on Delivery (COD) order creation with PENDING payment status", async () => {
      const session = {
        id: "sess-cod",
        buyerId: "buyer-1",
        status: "ACTIVE",
        subtotal: new Prisma.Decimal(1000),
        shippingAmount: new Prisma.Decimal(250),
        totalAmount: new Prisma.Decimal(1250),
        expiresAt: new Date(Date.now() + 600000),
        cart: {
          items: [
            {
              id: "it-cod",
              productId: "prod-1",
              sellerId: "farmer-1",
              quantity: new Prisma.Decimal(10),
              product: { id: "prod-1", title: "Wheat", unit: "kg", pricePerUnit: new Prisma.Decimal(100) },
            },
          ],
        },
      };

      (prisma.checkoutSession.findUnique as any).mockResolvedValue(session);
      (prisma.orderGroup.create as any).mockResolvedValue({
        id: "grp-cod",
        orderNumber: "AG-ORD-COD-001",
      });
      (prisma.order.create as any).mockResolvedValue({ id: "ord-cod" });
      (prisma.orderItem.create as any).mockResolvedValue({ id: "oi-cod" });
      (prisma.orderTimeline.create as any).mockResolvedValue({ id: "ot-cod" });
      (prisma.checkoutSession.update as any).mockResolvedValue({ id: "sess-cod" });
      (prisma.inventoryReservation.findMany as any).mockResolvedValue([]);
      (prisma.payment.create as any).mockResolvedValue({ id: "pay-cod" });
      (prisma.cartItem.deleteMany as any).mockResolvedValue({ count: 1 });
      (prisma.notification.create as any).mockResolvedValue({ id: "notif-cod" });
      (prisma.user.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.create as any).mockResolvedValue({ id: "audit-cod" });

      const result = await CheckoutService.confirmCheckout("buyer-1", {
        checkoutSessionId: "sess-cod",
        paymentMethod: "COD",
        shippingAddress: {
          recipientName: "COD Buyer",
          recipientPhone: "+919876543210",
          villageOrStreet: "Street 1",
          cityOrTown: "Kolkata",
          district: "Kolkata",
          state: "West Bengal",
          pincode: "700001",
        },
      });

      expect(result.orderNumber).toBe("AG-ORD-COD-001");
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentMethod: "COD",
            status: "PENDING",
          }),
        })
      );
    });

    it("should preserve Bank Transfer order creation with PENDING payment status", async () => {
      const session = {
        id: "sess-bt",
        buyerId: "buyer-1",
        status: "ACTIVE",
        subtotal: new Prisma.Decimal(2000),
        shippingAmount: new Prisma.Decimal(250),
        totalAmount: new Prisma.Decimal(2250),
        expiresAt: new Date(Date.now() + 600000),
        cart: {
          items: [
            {
              id: "it-bt",
              productId: "prod-2",
              sellerId: "farmer-2",
              quantity: new Prisma.Decimal(20),
              product: { id: "prod-2", title: "Rice", unit: "kg", pricePerUnit: new Prisma.Decimal(100) },
            },
          ],
        },
      };

      (prisma.checkoutSession.findUnique as any).mockResolvedValue(session);
      (prisma.orderGroup.create as any).mockResolvedValue({
        id: "grp-bt",
        orderNumber: "AG-ORD-BT-001",
      });
      (prisma.order.create as any).mockResolvedValue({ id: "ord-bt" });
      (prisma.orderItem.create as any).mockResolvedValue({ id: "oi-bt" });
      (prisma.orderTimeline.create as any).mockResolvedValue({ id: "ot-bt" });
      (prisma.checkoutSession.update as any).mockResolvedValue({ id: "sess-bt" });
      (prisma.inventoryReservation.findMany as any).mockResolvedValue([]);
      (prisma.payment.create as any).mockResolvedValue({ id: "pay-bt" });
      (prisma.cartItem.deleteMany as any).mockResolvedValue({ count: 1 });
      (prisma.notification.create as any).mockResolvedValue({ id: "notif-bt" });
      (prisma.user.findMany as any).mockResolvedValue([]);
      (prisma.auditLog.create as any).mockResolvedValue({ id: "audit-bt" });

      const result = await CheckoutService.confirmCheckout("buyer-1", {
        checkoutSessionId: "sess-bt",
        paymentMethod: "BANK_TRANSFER",
        shippingAddress: {
          recipientName: "BT Buyer",
          recipientPhone: "+919876543210",
          villageOrStreet: "Street 2",
          cityOrTown: "Kolkata",
          district: "Kolkata",
          state: "West Bengal",
          pincode: "700001",
        },
      });

      expect(result.orderNumber).toBe("AG-ORD-BT-001");
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentMethod: "BANK_TRANSFER",
            status: "PENDING",
          }),
        })
      );
    });
  });
});

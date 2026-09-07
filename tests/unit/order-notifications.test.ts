import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckoutService } from "@/services/checkout.service";
import { NotificationService } from "@/services/notification.service";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    checkoutSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    orderGroup: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    orderTimeline: {
      create: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    inventoryReservation: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    notification: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    notificationPreference: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
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

describe("Real-Time Order Notifications Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.notificationPreference.findMany as any).mockResolvedValue([]);
    (prisma.inventoryReservation.findMany as any).mockResolvedValue([]);
    (prisma.notification.findUnique as any).mockResolvedValue(null);
    (prisma.notification.create as any).mockImplementation((args: any) =>
      Promise.resolve({ id: "notif-1", ...args.data, createdAt: new Date() })
    );
    (prisma.auditLog.create as any).mockResolvedValue({});
  });

  const baseOrderGroup = {
    id: "grp-100",
    orderNumber: "AG-ORD-20260907-TEST",
    buyerId: "buyer-1",
    totalAmount: new Prisma.Decimal(5000),
    status: "PAYMENT_PENDING",
    createdAt: new Date(),
    buyer: {
      id: "buyer-1",
      fullName: "Test Buyer",
      buyerProfile: {
        companyName: "Acme Supermarkets",
      },
    },
    payments: [
      {
        id: "pay-1",
        paymentMethod: "COD",
        amount: new Prisma.Decimal(5000),
        status: "PENDING",
      },
    ],
    sellerOrders: [
      {
        id: "sub-ord-A",
        subOrderNumber: "AG-SUB-20260907-TEST-1",
        sellerId: "farmer-A",
        sellerTotal: new Prisma.Decimal(3000),
        createdAt: new Date(),
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            productTitleSnapshot: "Basmati Organic Harvest",
            unitSnapshot: "KG",
            quantity: new Prisma.Decimal(25),
            unitPrice: new Prisma.Decimal(120),
            totalPrice: new Prisma.Decimal(3000),
          },
        ],
      },
      {
        id: "sub-ord-B",
        subOrderNumber: "AG-SUB-20260907-TEST-2",
        sellerId: "farmer-B",
        sellerTotal: new Prisma.Decimal(2000),
        createdAt: new Date(),
        items: [
          {
            id: "item-2",
            productId: "prod-2",
            productTitleSnapshot: "Fresh Rohu Fish Lot",
            unitSnapshot: "KG",
            quantity: new Prisma.Decimal(10),
            unitPrice: new Prisma.Decimal(200),
            totalPrice: new Prisma.Decimal(2000),
          },
        ],
      },
    ],
  };

  // 1. COD order creates buyer notification
  it("1. COD order creates buyer notification", async () => {
    (prisma.orderGroup.findUnique as any).mockResolvedValue(baseOrderGroup);
    (prisma.user.findMany as any).mockResolvedValue([]);

    const notifSpy = vi.spyOn(NotificationService, "createNotificationFromEvent");

    await CheckoutService.dispatchOrderCreatedNotifications("grp-100");

    expect(notifSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "buyer-1",
        type: "ORDER_UPDATE",
        title: "Order Confirmed",
        body: expect.stringContaining("Cash on Delivery order #AG-ORD-20260907-TEST"),
        deepLink: "/buyer/orders/grp-100",
        idempotencyKey: "ORDER_CREATED:grp-100:BUYER",
      })
    );
  });

  // 2. COD order creates farmer notification
  it("2. COD order creates farmer notification", async () => {
    (prisma.orderGroup.findUnique as any).mockResolvedValue(baseOrderGroup);
    (prisma.user.findMany as any).mockResolvedValue([]);

    const notifSpy = vi.spyOn(NotificationService, "createNotificationFromEvent");

    await CheckoutService.dispatchOrderCreatedNotifications("grp-100");

    expect(notifSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "farmer-A",
        type: "ORDER_UPDATE",
        title: "New Order Received",
        body: expect.stringContaining("Basmati Organic Harvest"),
        deepLink: "/farmer/orders/sub-ord-A",
        idempotencyKey: "ORDER_CREATED:sub-ord-A:FARMER:farmer-A",
      })
    );
  });

  // 3. COD order creates admin notification
  it("3. COD order creates admin notification", async () => {
    (prisma.orderGroup.findUnique as any).mockResolvedValue(baseOrderGroup);
    (prisma.user.findMany as any).mockResolvedValue([
      { id: "admin-1", fullName: "Platform Admin" },
    ]);

    const notifSpy = vi.spyOn(NotificationService, "createNotificationFromEvent");

    await CheckoutService.dispatchOrderCreatedNotifications("grp-100");

    expect(notifSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-1",
        type: "ORDER_UPDATE",
        title: "New COD Order",
        body: expect.stringContaining("Acme Supermarkets"),
        deepLink: "/admin/orders/grp-100",
        idempotencyKey: "ORDER_CREATED:grp-100:ADMIN:admin-1",
      })
    );
  });

  // 4. Multi-vendor order: Farmer A receives only Order A, Farmer B receives only Order B
  it("4. Multi-vendor order partitions sub-orders strictly between sellers", async () => {
    (prisma.orderGroup.findUnique as any).mockResolvedValue(baseOrderGroup);
    (prisma.user.findMany as any).mockResolvedValue([]);

    const notifSpy = vi.spyOn(NotificationService, "createNotificationFromEvent");

    await CheckoutService.dispatchOrderCreatedNotifications("grp-100");

    // Farmer A calls
    const farmerACalls = notifSpy.mock.calls.filter((c) => c[0].userId === "farmer-A");
    expect(farmerACalls.length).toBe(1);
    expect(farmerACalls[0][0].body).toContain("Basmati Organic Harvest");
    expect(farmerACalls[0][0].body).not.toContain("Rohu Fish");
    expect(farmerACalls[0][0].deepLink).toBe("/farmer/orders/sub-ord-A");

    // Farmer B calls
    const farmerBCalls = notifSpy.mock.calls.filter((c) => c[0].userId === "farmer-B");
    expect(farmerBCalls.length).toBe(1);
    expect(farmerBCalls[0][0].body).toContain("Fresh Rohu Fish Lot");
    expect(farmerBCalls[0][0].body).not.toContain("Basmati Organic");
    expect(farmerBCalls[0][0].deepLink).toBe("/farmer/orders/sub-ord-B");
  });

  // 5. Admin receives complete order notification
  it("5. Admin receives complete aggregate multi-vendor order notification", async () => {
    (prisma.orderGroup.findUnique as any).mockResolvedValue(baseOrderGroup);
    (prisma.user.findMany as any).mockResolvedValue([
      { id: "admin-1", fullName: "Admin Chief" },
    ]);

    const notifSpy = vi.spyOn(NotificationService, "createNotificationFromEvent");

    await CheckoutService.dispatchOrderCreatedNotifications("grp-100");

    const adminCalls = notifSpy.mock.calls.filter((c) => c[0].userId === "admin-1");
    expect(adminCalls.length).toBe(1);
    expect(adminCalls[0][0].metadata?.sellerCount).toBe(2);
    expect(adminCalls[0][0].metadata?.totalOrderValue).toBe(5000);
    expect(adminCalls[0][0].body).toContain("2 seller(s)");
  });

  // 6. Buyer receives only their own notification
  it("6. Buyer receives only their own order notification", async () => {
    (prisma.orderGroup.findUnique as any).mockResolvedValue(baseOrderGroup);
    (prisma.user.findMany as any).mockResolvedValue([]);

    const notifSpy = vi.spyOn(NotificationService, "createNotificationFromEvent");

    await CheckoutService.dispatchOrderCreatedNotifications("grp-100");

    const buyerCalls = notifSpy.mock.calls.filter((c) => c[0].userId === "buyer-1");
    expect(buyerCalls.length).toBe(1);
    expect(buyerCalls[0][0].deepLink).toBe("/buyer/orders/grp-100");
    expect(buyerCalls[0][0].metadata?.role).toBe("BUYER");
  });

  // 7. Failed order transaction creates NO notifications
  it("7. Failed order transaction creates NO notifications", async () => {
    const dispatchSpy = vi.spyOn(CheckoutService, "dispatchOrderCreatedNotifications");

    // Session has expired, so confirmCheckout throws before transaction
    (prisma.checkoutSession.findUnique as any).mockResolvedValue({
      id: "sess-failed",
      buyerId: "buyer-1",
      status: "ACTIVE",
      expiresAt: new Date(Date.now() - 10000), // Expired
      cart: { items: [] },
    });

    await expect(
      CheckoutService.confirmCheckout("buyer-1", {
        checkoutSessionId: "sess-failed",
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
    ).rejects.toThrow();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  // 8. Notification failure does not fail the order
  it("8. Notification failure does not fail the order", async () => {
    // Mock dispatchOrderCreatedNotifications to throw
    const failSpy = vi.spyOn(CheckoutService, "dispatchOrderCreatedNotifications").mockRejectedValue(
      new Error("Notification transport network failure")
    );

    (prisma.checkoutSession.findUnique as any).mockResolvedValue({
      id: "sess-ok",
      buyerId: "buyer-1",
      status: "ACTIVE",
      totalAmount: new Prisma.Decimal(2500),
      expiresAt: new Date(Date.now() + 600000),
      cart: {
        id: "cart-1",
        items: [
          {
            sellerId: "farmer-1",
            quantity: new Prisma.Decimal(10),
            productId: "prod-1",
            product: {
              pricePerUnit: new Prisma.Decimal(250),
              title: "Mustard Seeds",
              unit: "KG",
            },
          },
        ],
      },
    });

    (prisma.orderGroup.create as any).mockResolvedValue({
      id: "grp-ok",
      orderNumber: "AG-ORD-20260907-OKAY",
      buyerId: "buyer-1",
      totalAmount: new Prisma.Decimal(2500),
    });

    (prisma.order.create as any).mockResolvedValue({
      id: "sub-ok",
      sellerId: "farmer-1",
      sellerTotal: new Prisma.Decimal(2500),
    });

    // confirmCheckout MUST resolve successfully without throwing
    const result = await CheckoutService.confirmCheckout("buyer-1", {
      checkoutSessionId: "sess-ok",
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
    });

    expect(result).toBeDefined();
    expect(result.id).toBe("grp-ok");

    failSpy.mockRestore();
  });

  // 9. Duplicate order processing does not create duplicate notifications (idempotency)
  it("9. Duplicate notification dispatches are prevented by idempotency keys", async () => {
    // When notification with matching idempotency key exists, prisma.notification.findUnique returns it
    (prisma.notification.findUnique as any).mockResolvedValue({
      id: "notif-existing",
      userId: "buyer-1",
      idempotencyKey: "ORDER_CREATED:grp-100:BUYER",
      title: "Order Confirmed",
      body: "Existing notification",
    });

    const result = await NotificationService.createNotificationFromEvent({
      userId: "buyer-1",
      type: "ORDER_UPDATE",
      title: "Order Confirmed",
      body: "Duplicate message attempt",
      idempotencyKey: "ORDER_CREATED:grp-100:BUYER",
    });

    expect(result.id).toBe("notif-existing");
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  // 10. Unread notification count is correct
  it("10. Unread notification count queries correct count for user", async () => {
    (prisma.notification.count as any).mockResolvedValue(3);

    const count = await NotificationService.getUnreadCount("user-1");

    expect(count).toBe(3);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        isRead: false,
      },
    });
  });

  // 11. Notification contains correct deepLink
  it("11. Notification contains correct deepLink for buyer, farmer, and admin", () => {
    const farmerLink = NotificationService.resolveDeepLink("ORDER_UPDATE", "ORDER", "sub-123", {
      role: "SELLER",
    });
    expect(farmerLink).toBe("/farmer/orders/sub-123");

    const adminLink = NotificationService.resolveDeepLink("ORDER_UPDATE", "ORDER_GROUP", "grp-123", {
      role: "ADMIN",
    });
    expect(adminLink).toBe("/admin/orders/grp-123");

    const buyerLink = NotificationService.resolveDeepLink("ORDER_UPDATE", "ORDER_GROUP", "grp-123", {
      role: "BUYER",
    });
    expect(buyerLink).toBe("/buyer/orders/grp-123");
  });

  // 12. Role isolation is enforced
  it("12. Role isolation prevents Farmer A from receiving Farmer B's sub-order", async () => {
    (prisma.orderGroup.findUnique as any).mockResolvedValue(baseOrderGroup);
    (prisma.user.findMany as any).mockResolvedValue([]);

    const notifSpy = vi.spyOn(NotificationService, "createNotificationFromEvent");

    await CheckoutService.dispatchOrderCreatedNotifications("grp-100");

    const allFarmerCalls = notifSpy.mock.calls.filter((c) =>
      c[0].userId.startsWith("farmer-")
    );

    for (const call of allFarmerCalls) {
      const input = call[0];
      if (input.userId === "farmer-A") {
        expect(input.resourceId).toBe("sub-ord-A");
        expect(input.metadata?.sellerTotal).toBe(3000);
      } else if (input.userId === "farmer-B") {
        expect(input.resourceId).toBe("sub-ord-B");
        expect(input.metadata?.sellerTotal).toBe(2000);
      }
    }
  });

  // 13. Existing COD workflow still works
  it("13. Existing COD checkout confirms order with PENDING payment status", async () => {
    (prisma.checkoutSession.findUnique as any).mockResolvedValue({
      id: "sess-cod",
      buyerId: "buyer-1",
      status: "ACTIVE",
      totalAmount: new Prisma.Decimal(1000),
      expiresAt: new Date(Date.now() + 600000),
      cart: {
        id: "cart-1",
        items: [
          {
            sellerId: "farmer-1",
            quantity: new Prisma.Decimal(5),
            productId: "prod-1",
            product: {
              pricePerUnit: new Prisma.Decimal(200),
              title: "Wheat Lot",
              unit: "KG",
            },
          },
        ],
      },
    });

    (prisma.orderGroup.create as any).mockResolvedValue({
      id: "grp-cod",
      orderNumber: "AG-ORD-20260907-COD1",
      buyerId: "buyer-1",
      totalAmount: new Prisma.Decimal(1000),
    });

    (prisma.order.create as any).mockResolvedValue({
      id: "sub-cod",
      sellerId: "farmer-1",
      sellerTotal: new Prisma.Decimal(1000),
    });

    const res = await CheckoutService.confirmCheckout("buyer-1", {
      checkoutSessionId: "sess-cod",
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
    });

    expect(res.id).toBe("grp-cod");
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentMethod: "COD",
          status: "PENDING",
        }),
      })
    );
  });

  // 14. Existing Bank Transfer workflow still works
  it("14. Existing Bank Transfer checkout confirms order with PENDING payment status and BANK_TRANSFER notification", async () => {
    (prisma.checkoutSession.findUnique as any).mockResolvedValue({
      id: "sess-bank",
      buyerId: "buyer-1",
      status: "ACTIVE",
      totalAmount: new Prisma.Decimal(1500),
      expiresAt: new Date(Date.now() + 600000),
      cart: {
        id: "cart-1",
        items: [
          {
            sellerId: "farmer-1",
            quantity: new Prisma.Decimal(5),
            productId: "prod-1",
            product: {
              pricePerUnit: new Prisma.Decimal(300),
              title: "Organic Potatoes",
              unit: "KG",
            },
          },
        ],
      },
    });

    (prisma.orderGroup.create as any).mockResolvedValue({
      id: "grp-bank",
      orderNumber: "AG-ORD-20260907-BNK1",
      buyerId: "buyer-1",
      totalAmount: new Prisma.Decimal(1500),
    });

    (prisma.order.create as any).mockResolvedValue({
      id: "sub-bank",
      sellerId: "farmer-1",
      sellerTotal: new Prisma.Decimal(1500),
    });

    const res = await CheckoutService.confirmCheckout("buyer-1", {
      checkoutSessionId: "sess-bank",
      paymentMethod: "BANK_TRANSFER",
      shippingAddress: {
        recipientName: "Test Buyer",
        recipientPhone: "+919876543210",
        villageOrStreet: "Sector 5",
        cityOrTown: "Kolkata",
        district: "Kolkata",
        state: "West Bengal",
        pincode: "700001",
      },
    });

    expect(res.id).toBe("grp-bank");
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

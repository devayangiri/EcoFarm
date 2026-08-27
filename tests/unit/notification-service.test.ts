import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "@/services/notification.service";
import { messageEventBus } from "@/lib/events/message-bus";
import { prisma } from "@/lib/prisma";

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    notificationPreference: {
      findMany: vi.fn(),
      upsert: vi.fn(),
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

describe("Phase 12: Notification Hub, Preferences & Multi-Channel Foundation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------
  // 1. NOTIFICATION CREATION & IDEMPOTENCY
  // ----------------------------------------------------
  describe("1. Idempotent Notification Creation & SSE Dispatch", () => {
    it("should persist notification, create audit log, and publish SSE event", async () => {
      const publishSpy = vi.spyOn(messageEventBus, "publish");

      (prisma.notification.findUnique as any).mockResolvedValue(null);
      (prisma.notificationPreference.findMany as any).mockResolvedValue([]);

      const mockDate = new Date();
      (prisma.notification.create as any).mockResolvedValue({
        id: "notif-1",
        userId: "user-100",
        type: "ORDER_UPDATE",
        title: "Order Confirmed",
        body: "Your order #ORD-101 has been confirmed by seller.",
        deepLink: "/buyer/orders/ORD-101",
        resourceType: "Order",
        resourceId: "ORD-101",
        idempotencyKey: "evt-ord-101:user-100",
        metadata: { orderId: "ORD-101" },
        createdAt: mockDate,
      });

      const result = await NotificationService.createNotificationFromEvent({
        userId: "user-100",
        type: "ORDER_UPDATE",
        title: "Order Confirmed",
        body: "Your order #ORD-101 has been confirmed by seller.",
        resourceType: "Order",
        resourceId: "ORD-101",
        idempotencyKey: "evt-ord-101:user-100",
        metadata: { orderId: "ORD-101" },
      });

      expect(result.id).toBe("notif-1");
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "NOTIFICATION_SENT",
            actorUserId: "user-100",
          }),
        })
      );

      // Verify SSE event published
      expect(publishSpy).toHaveBeenCalledWith(
        ["user-100"],
        expect.objectContaining({
          type: "NOTIFICATION_CREATED",
          eventId: "notif-1",
        })
      );
    });

    it("should return existing notification and prevent duplicate SSE if idempotencyKey exists", async () => {
      const publishSpy = vi.spyOn(messageEventBus, "publish");

      const existingNotif = {
        id: "notif-existing",
        userId: "user-100",
        type: "ORDER_UPDATE",
        title: "Order Confirmed",
        body: "Your order #ORD-101 has been confirmed.",
        idempotencyKey: "evt-ord-101:user-100",
        createdAt: new Date(),
      };

      (prisma.notification.findUnique as any).mockResolvedValue(existingNotif);

      const result = await NotificationService.createNotificationFromEvent({
        userId: "user-100",
        type: "ORDER_UPDATE",
        title: "Order Confirmed",
        body: "Your order #ORD-101 has been confirmed.",
        idempotencyKey: "evt-ord-101:user-100",
      });

      expect(result.id).toBe("notif-existing");
      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------
  // 2. MULTI-RECIPIENT GENERATION
  // ----------------------------------------------------
  describe("2. Multi-Recipient Domain Event Generation", () => {
    it("should generate deterministic per-recipient notifications", async () => {
      (prisma.notification.findUnique as any).mockResolvedValue(null);
      (prisma.notificationPreference.findMany as any).mockResolvedValue([]);

      (prisma.notification.create as any).mockImplementation(({ data }: any) => ({
        id: `notif-${data.userId}`,
        ...data,
        createdAt: new Date(),
      }));

      const results = await NotificationService.createNotificationsForRecipients(
        ["buyer-1", "seller-1"],
        {
          type: "ORDER_UPDATE",
          title: "New Order Activity",
          body: "Order update for #ORD-999",
          resourceId: "ORD-999",
          eventIdPrefix: "evt-ord-999",
        }
      );

      expect(results.length).toBe(2);
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
    });
  });

  // ----------------------------------------------------
  // 3. CHANNEL PREFERENCE ENFORCEMENT
  // ----------------------------------------------------
  describe("3. Channel Preference Enforcement", () => {
    it("should not publish SSE if user disabled IN_APP notifications for this type", async () => {
      const publishSpy = vi.spyOn(messageEventBus, "publish");

      (prisma.notification.findUnique as any).mockResolvedValue(null);
      (prisma.notificationPreference.findMany as any).mockResolvedValue([
        { channel: "IN_APP", type: "CONNECTION_REQUEST", isEnabled: false },
      ]);

      (prisma.notification.create as any).mockResolvedValue({
        id: "notif-disabled",
        userId: "user-optout",
        type: "CONNECTION_REQUEST",
        title: "Connection Request",
        body: "User requested connection",
        createdAt: new Date(),
      });

      await NotificationService.createNotificationFromEvent({
        userId: "user-optout",
        type: "CONNECTION_REQUEST",
        title: "Connection Request",
        body: "User requested connection",
      });

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------
  // 4. DEEP LINK RESOLUTION & SECURITY
  // ----------------------------------------------------
  describe("4. Centralized Server Deep Link Routing", () => {
    it("should resolve correct internal application routes", () => {
      expect(NotificationService.resolveDeepLink("MESSAGE", "Conversation", "conv-123")).toBe(
        "/messages?conversationId=conv-123"
      );
      expect(NotificationService.resolveDeepLink("ORDER_UPDATE", "Order", "ord-123", { role: "BUYER" })).toBe(
        "/buyer/orders/ord-123"
      );
      expect(NotificationService.resolveDeepLink("ORDER_UPDATE", "Order", "ord-123", { role: "SELLER" })).toBe(
        "/farmer/orders/ord-123"
      );
      expect(NotificationService.resolveDeepLink("CONNECTION_REQUEST")).toBe(
        "/network/connections"
      );
      expect(NotificationService.resolveDeepLink("SERVICE_UPDATE", "Service", "srv-1", { requestId: "req-456" })).toBe(
        "/services/request/req-456"
      );
      expect(NotificationService.resolveDeepLink("AGENT_UPDATE", "Task", "tsk-1", { target: "TASKS" })).toBe(
        "/agent/tasks"
      );
    });
  });

  // ----------------------------------------------------
  // 5. READ / UNREAD & IDOR PROTECTION
  // ----------------------------------------------------
  describe("5. Read State & IDOR Ownership Protection", () => {
    it("should allow recipient to mark their own notification as read", async () => {
      (prisma.notification.findUnique as any).mockResolvedValue({
        id: "notif-1",
        userId: "user-owner",
        isRead: false,
      });
      (prisma.notification.update as any).mockResolvedValue({
        id: "notif-1",
        userId: "user-owner",
        isRead: true,
        readAt: new Date(),
      });

      const res = await NotificationService.markAsRead("user-owner", "notif-1");
      expect(res.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalled();
    });

    it("should reject non-recipient from marking another user's notification as read (BOLA/IDOR)", async () => {
      (prisma.notification.findUnique as any).mockResolvedValue({
        id: "notif-1",
        userId: "user-owner",
        isRead: false,
      });

      await expect(
        NotificationService.markAsRead("user-attacker", "notif-1")
      ).rejects.toThrow(/do not have permission/);
    });

    it("should atomically mark all user notifications as read", async () => {
      (prisma.notification.updateMany as any).mockResolvedValue({ count: 5 });

      const res = await NotificationService.markAllAsRead("user-owner");
      expect(res.count).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-owner", isRead: false },
        data: expect.objectContaining({ isRead: true }),
      });
    });
  });

  // ----------------------------------------------------
  // 6. PREFERENCES & DEFAULT MATRIX
  // ----------------------------------------------------
  describe("6. Notification Preferences Management", () => {
    it("should initialize sensible defaults with IN_APP enabled and SMS/WhatsApp disabled", async () => {
      (prisma.notificationPreference.findMany as any).mockResolvedValue([]);

      const matrix = await NotificationService.getPreferences("user-new");
      expect(matrix.length).toBe(36); // 9 types * 4 channels

      const inAppOrder = matrix.find((m) => m.channel === "IN_APP" && m.type === "ORDER_UPDATE");
      const smsOrder = matrix.find((m) => m.channel === "SMS" && m.type === "ORDER_UPDATE");
      const whatsappOrder = matrix.find((m) => m.channel === "WHATSAPP" && m.type === "ORDER_UPDATE");

      expect(inAppOrder?.isEnabled).toBe(true);
      expect(smsOrder?.isEnabled).toBe(false);
      expect(whatsappOrder?.isEnabled).toBe(false);
    });

    it("should update user preferences and write audit log", async () => {
      (prisma.notificationPreference.upsert as any).mockResolvedValue({});
      (prisma.notificationPreference.findMany as any).mockResolvedValue([
        { channel: "EMAIL", type: "ORDER_UPDATE", isEnabled: false },
      ]);

      const updated = await NotificationService.updatePreferences("user-1", {
        preferences: [{ channel: "EMAIL", type: "ORDER_UPDATE", isEnabled: false }],
      });

      expect(prisma.notificationPreference.upsert).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "NOTIFICATION_PREFERENCE_UPDATED",
          }),
        })
      );
    });
  });
});

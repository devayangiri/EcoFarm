import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessagingService } from "@/services/messaging.service";
import { messageEventBus } from "@/lib/events/message-bus";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    conversationParticipant: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    message: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    messageAttachment: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
    },
    serviceListing: {
      findUnique: vi.fn(),
    },
    agentAssignment: {
      findFirst: vi.fn(),
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

describe("Phase 11: Contextual Messaging, Conversations & Realtime SSE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------
  // 1. CONVERSATION AUTHORIZATION & IDOR PROTECTION
  // ----------------------------------------------------
  describe("1. Conversation Access & Membership Security", () => {
    it("should allow an authorized participant to access their conversation", async () => {
      (prisma.conversationParticipant.findUnique as any).mockResolvedValue({
        id: "part-1",
        conversationId: "conv-1",
        userId: "user-buyer-1",
        conversation: {
          id: "conv-1",
          title: "Direct Inquiry",
          participants: [
            { userId: "user-buyer-1", user: { id: "user-buyer-1", fullName: "Buyer One" } },
            { userId: "user-farmer-1", user: { id: "user-farmer-1", fullName: "Farmer One" } },
          ],
        },
      });

      const participant = await MessagingService.validateConversationAccess("user-buyer-1", "conv-1");
      expect(participant.conversationId).toBe("conv-1");
      expect(participant.userId).toBe("user-buyer-1");
    });

    it("should block non-participants from accessing private conversations (BOLA/IDOR Protection)", async () => {
      (prisma.conversationParticipant.findUnique as any).mockResolvedValue(null);

      await expect(
        MessagingService.validateConversationAccess("unauthorized-user", "conv-1")
      ).rejects.toThrow(/do not have permission/);
    });
  });

  // ----------------------------------------------------
  // 2. CONTEXTUAL AUTHORIZATION & SERVER SNAPSHOTS
  // ----------------------------------------------------
  describe("2. Contextual Messaging & Authoritative Snapshots", () => {
    it("should generate authoritative server snapshot for PRODUCT context", async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        id: "prod-100",
        title: "Fresh Rohu Carp",
        pricePerUnit: new Decimal(220),
        unit: "KG",
        sellerId: "farmer-1",
        images: [{ url: "https://example.com/rohu.jpg" }],
        seller: { fullName: "Ratan Ghosh" },
      });

      const { snapshot, defaultTitle } = await MessagingService.validateContextAccess(
        "buyer-1",
        "PRODUCT",
        "prod-100",
        "farmer-1"
      );

      expect(snapshot.type).toBe("PRODUCT");
      expect(snapshot.title).toBe("Fresh Rohu Carp");
      expect(snapshot.price).toBe(220);
      expect(snapshot.unit).toBe("KG");
      expect(snapshot.sellerName).toBe("Ratan Ghosh");
      expect(defaultTitle).toBe("Inquiry: Fresh Rohu Carp");
    });

    it("should reject product context communication if neither participant is seller or assigned agent", async () => {
      (prisma.product.findUnique as any).mockResolvedValue({
        id: "prod-100",
        sellerId: "unrelated-seller",
      });
      (prisma.agentAssignment.findFirst as any).mockResolvedValue(null);

      await expect(
        MessagingService.validateContextAccess("buyer-1", "PRODUCT", "prod-100", "third-party")
      ).rejects.toThrow(/Unauthorized product communication/);
    });

    it("should generate authoritative server snapshot for ORDER context", async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: "order-1",
        subOrderNumber: "ORD-SUB-9001",
        status: "DISPATCHED",
        sellerTotal: new Decimal(4500),
        sellerId: "seller-1",
        orderGroup: { buyerId: "buyer-1", orderNumber: "ORD-9001" },
        seller: { fullName: "East Bengal Seeds" },
      });

      const { snapshot, defaultTitle } = await MessagingService.validateContextAccess(
        "buyer-1",
        "ORDER",
        "order-1",
        "seller-1"
      );

      expect(snapshot.type).toBe("ORDER");
      expect(snapshot.orderNumber).toBe("ORD-SUB-9001");
      expect(snapshot.status).toBe("DISPATCHED");
      expect(snapshot.total).toBe(4500);
      expect(defaultTitle).toBe("Order #ORD-SUB-9001");
    });
  });

  // ----------------------------------------------------
  // 3. MESSAGE DISPATCH & REALTIME PUBLICATION
  // ----------------------------------------------------
  describe("3. Message Sending, Notification & SSE Event Bus", () => {
    it("should create message, update read state, notify recipient and emit SSE event", async () => {
      const publishSpy = vi.spyOn(messageEventBus, "publish");

      (prisma.conversationParticipant.findUnique as any).mockResolvedValue({
        id: "part-1",
        conversationId: "conv-1",
        userId: "buyer-1",
        conversation: {
          id: "conv-1",
          contextType: "PRODUCT",
          contextId: "prod-100",
          contextSnapshot: { title: "Fresh Fish" },
          participants: [{ userId: "buyer-1" }, { userId: "farmer-1" }],
        },
      });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "buyer-1",
        fullName: "Rahul Sen",
      });

      (prisma.message.create as any).mockResolvedValue({
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "buyer-1",
        content: "What is your available delivery date?",
        contextType: "PRODUCT",
        contextId: "prod-100",
        contextSnapshot: { title: "Fresh Fish" },
        attachments: [],
        createdAt: new Date(),
        sender: { id: "buyer-1", fullName: "Rahul Sen", role: "BUYER" },
      });

      const result = await MessagingService.sendMessage("buyer-1", {
        conversationId: "conv-1",
        content: "What is your available delivery date?",
      });

      expect(result.id).toBe("msg-1");
      expect(result.content).toBe("What is your available delivery date?");

      // Verify in-app notification created for recipient
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "farmer-1",
            type: "MESSAGE",
          }),
        })
      );

      // Verify Audit Log created
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "MESSAGE_SENT",
          }),
        })
      );

      // Verify SSE event published to both participants
      expect(publishSpy).toHaveBeenCalledWith(
        ["buyer-1", "farmer-1"],
        expect.objectContaining({
          type: "MESSAGE_CREATED",
          conversationId: "conv-1",
        })
      );
    });
  });

  // ----------------------------------------------------
  // 4. READ STATE & UNREAD COUNTS
  // ----------------------------------------------------
  describe("4. Read State Management", () => {
    it("should update participant lastReadAt and emit MESSAGE_READ event", async () => {
      const publishSpy = vi.spyOn(messageEventBus, "publish");

      (prisma.conversationParticipant.findUnique as any).mockResolvedValue({
        id: "part-1",
        conversationId: "conv-1",
        userId: "farmer-1",
        conversation: {
          id: "conv-1",
          participants: [{ userId: "buyer-1" }, { userId: "farmer-1" }],
        },
      });

      const res = await MessagingService.markConversationRead("farmer-1", "conv-1");
      expect(res.success).toBe(true);
      expect(prisma.conversationParticipant.update).toHaveBeenCalled();
      expect(publishSpy).toHaveBeenCalledWith(
        ["buyer-1", "farmer-1"],
        expect.objectContaining({
          type: "MESSAGE_READ",
          conversationId: "conv-1",
        })
      );
    });
  });

  // ----------------------------------------------------
  // 5. MESSAGE SOFT DELETION
  // ----------------------------------------------------
  describe("5. Soft Deletion Controls", () => {
    it("should allow sender to soft-delete own message", async () => {
      (prisma.message.findUnique as any).mockResolvedValue({
        id: "msg-1",
        senderId: "buyer-1",
        conversationId: "conv-1",
        isDeleted: false,
        conversation: { participants: [{ userId: "buyer-1" }, { userId: "farmer-1" }] },
      });

      const res = await MessagingService.softDeleteMessage("buyer-1", "msg-1");
      expect(res.success).toBe(true);
      expect(prisma.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "msg-1" },
          data: expect.objectContaining({ isDeleted: true, deletedById: "buyer-1" }),
        })
      );
    });

    it("should reject non-sender from deleting another participant's message", async () => {
      (prisma.message.findUnique as any).mockResolvedValue({
        id: "msg-1",
        senderId: "buyer-1",
      });

      await expect(
        MessagingService.softDeleteMessage("attacker-user", "msg-1")
      ).rejects.toThrow(/only delete your own/);
    });
  });

  // ----------------------------------------------------
  // 6. REALTIME EVENT BUS SUBSCRIPTIONS
  // ----------------------------------------------------
  describe("6. Realtime MessageEventBus Isolation", () => {
    it("should deliver events only to subscribed user channel", () => {
      const receivedEvents: any[] = [];
      const unsub = messageEventBus.subscribe("user-100", (event) => {
        receivedEvents.push(event);
      });

      // Publish event for user-100
      messageEventBus.publish(["user-100"], {
        type: "MESSAGE_CREATED",
        eventId: "e-1",
        conversationId: "conv-1",
        timestamp: new Date().toISOString(),
        data: { text: "Hello User 100" },
      });

      // Publish event for user-200
      messageEventBus.publish(["user-200"], {
        type: "MESSAGE_CREATED",
        eventId: "e-2",
        conversationId: "conv-2",
        timestamp: new Date().toISOString(),
        data: { text: "Hello User 200" },
      });

      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].data.text).toBe("Hello User 100");

      unsub();

      // Publish again after unsubscribe
      messageEventBus.publish(["user-100"], {
        type: "MESSAGE_CREATED",
        eventId: "e-3",
        conversationId: "conv-1",
        timestamp: new Date().toISOString(),
        data: { text: "Should not receive" },
      });

      expect(receivedEvents.length).toBe(1);
    });
  });
});

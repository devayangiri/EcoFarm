import { describe, it, expect, vi, beforeEach } from "vitest";
import { NetworkService } from "@/services/network.service";
import { prisma } from "@/lib/prisma";

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    networkProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    connectionRequest: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    businessConnection: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    conversation: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    message: {
      create: vi.fn(),
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

describe("Phase 8: Business Network, B2B Directory & Connection System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------
  // 1. DIRECTORY SEARCH & PRIVACY
  // ----------------------------------------------------
  describe("1. Directory Search & Privacy Boundary", () => {
    it("should search directory and return safe public profile data", async () => {
      (prisma.networkProfile.findMany as any).mockResolvedValue([
        {
          id: "np-1",
          userId: "user-1",
          displayName: "Sundarban Fishery FPO",
          headline: "Hatchery & Live Fish Producer",
          bio: "Quality fingerlings supplier",
          participantType: "FARMER",
          businessCategory: "Aquaculture Hatchery",
          sector: "AQUACULTURE",
          district: "South 24 Parganas",
          state: "West Bengal",
          avatarUrl: "https://example.com/avatar.jpg",
          isVerified: true,
          connectionCount: 15,
          user: {
            role: "FARMER",
            farmerProfile: { farms: [] },
            products: [],
          },
        },
      ]);
      (prisma.networkProfile.count as any).mockResolvedValue(1);

      const result = await NetworkService.searchDirectory({
        search: "Fishery",
        participantType: "ALL",
        sector: "AQUACULTURE",
        verifiedOnly: false,
        page: 1,
        pageSize: 20,
        sortBy: "newest",
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].displayName).toBe("Sundarban Fishery FPO");
      expect(result.items[0].isVerified).toBe(true);
      expect((result.items[0] as any).passwordHash).toBeUndefined();
    });
  });

  // ----------------------------------------------------
  // 2. CONNECTION REQUEST RULES & SECURITY
  // ----------------------------------------------------
  describe("2. Connection Request State Machine & Security", () => {
    it("should block a user from sending a connection request to themselves", async () => {
      await expect(
        NetworkService.sendConnectionRequest("user-1", {
          targetUserId: "user-1",
          message: "Let's connect",
        })
      ).rejects.toThrow(/cannot send a connection request to yourself/);
    });

    it("should reject connection request if an active connection already exists", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-2",
        status: "ACTIVE",
      });
      (prisma.businessConnection.findFirst as any).mockResolvedValue({
        id: "conn-123",
        userAId: "user-1",
        userBId: "user-2",
      });

      await expect(
        NetworkService.sendConnectionRequest("user-1", {
          targetUserId: "user-2",
        })
      ).rejects.toThrow(/already connected/);
    });

    it("should reject connection request if a pending request already exists", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-2",
        status: "ACTIVE",
      });
      (prisma.businessConnection.findFirst as any).mockResolvedValue(null);
      (prisma.connectionRequest.findFirst as any).mockResolvedValue({
        id: "req-existing",
        status: "PENDING",
      });

      await expect(
        NetworkService.sendConnectionRequest("user-1", {
          targetUserId: "user-2",
        })
      ).rejects.toThrow(/pending connection request already exists/);
    });

    it("should allow receiver to accept request and create canonical BusinessConnection", async () => {
      (prisma.connectionRequest.findUnique as any).mockResolvedValue({
        id: "req-1",
        senderId: "user-sender",
        receiverId: "user-receiver",
        status: "PENDING",
      });

      (prisma.connectionRequest.update as any).mockResolvedValue({
        id: "req-1",
        status: "ACCEPTED",
      });

      const result = await NetworkService.acceptConnectionRequest("user-receiver", "req-1");

      expect(result.status).toBe("ACCEPTED");
      expect(prisma.businessConnection.upsert).toHaveBeenCalled();
      expect(prisma.networkProfile.updateMany).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CONNECTION_REQUEST_ACCEPTED",
          }),
        })
      );
    });

    it("should block non-receiver from accepting a connection request (IDOR prevention)", async () => {
      (prisma.connectionRequest.findUnique as any).mockResolvedValue({
        id: "req-1",
        senderId: "user-sender",
        receiverId: "user-receiver",
        status: "PENDING",
      });

      await expect(
        NetworkService.acceptConnectionRequest("user-intruder", "req-1")
      ).rejects.toThrow(/permission/);
    });

    it("should block non-sender from cancelling a connection request", async () => {
      (prisma.connectionRequest.findUnique as any).mockResolvedValue({
        id: "req-1",
        senderId: "user-sender",
        receiverId: "user-receiver",
        status: "PENDING",
      });

      await expect(
        NetworkService.cancelConnectionRequest("user-other", "req-1")
      ).rejects.toThrow(/permission/);
    });
  });

  // ----------------------------------------------------
  // 3. ENQUIRY SYSTEM & CONTEXTUAL MESSAGING
  // ----------------------------------------------------
  describe("3. Professional Enquiries & Lead Context", () => {
    it("should prevent sending an enquiry to oneself", async () => {
      await expect(
        NetworkService.createEnquiry("user-1", {
          targetUserId: "user-1",
          content: "Inquiry about 50 tons of grain supply",
        })
      ).rejects.toThrow(/cannot send an enquiry to yourself/);
    });

    it("should create conversation and message with BUSINESS context and audit log", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-seller",
        fullName: "Organic Farmer Enterprise",
      });
      (prisma.conversation.findFirst as any).mockResolvedValue(null);
      (prisma.conversation.create as any).mockResolvedValue({
        id: "conv-1",
      });
      (prisma.message.create as any).mockResolvedValue({
        id: "msg-1",
        content: "We require 20 tons of Swarna Paddy.",
      });

      const result = await NetworkService.createEnquiry("user-buyer", {
        targetUserId: "user-seller",
        content: "We require 20 tons of Swarna Paddy.",
        contextSnapshot: { targetName: "Organic Farmer Enterprise" },
      });

      expect(result.id).toBe("msg-1");
      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contextType: "BUSINESS",
            senderId: "user-buyer",
          }),
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "NETWORK_ENQUIRY_CREATED",
          }),
        })
      );
    });
  });

  // ----------------------------------------------------
  // 4. NETWORK PROFILE MANAGEMENT
  // ----------------------------------------------------
  describe("4. Network Profile Management", () => {
    it("should upsert own network profile and record audit log", async () => {
      (prisma.networkProfile.upsert as any).mockResolvedValue({
        id: "np-1",
        userId: "user-1",
        displayName: "Bengal Agro Traders",
        headline: "Grain Merchant",
      });

      const updated = await NetworkService.updateOwnNetworkProfile("user-1", {
        displayName: "Bengal Agro Traders",
        headline: "Grain Merchant",
        bio: "Specializing in premium non-basmati rice export.",
        district: "Bardhaman",
        state: "West Bengal",
      });

      expect(updated.displayName).toBe("Bengal Agro Traders");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "NETWORK_PROFILE_UPDATED",
          }),
        })
      );
    });
  });
});
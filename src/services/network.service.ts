import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma, Sector } from "@prisma/client";
import type {
  NetworkDirectorySearchInput,
  SendConnectionRequestInput,
  CreateNetworkEnquiryInput,
  UpdateNetworkProfileInput,
} from "@/lib/validators/network.schema";

export type ConnectionStatusType =
  | "SELF"
  | "CONNECTED"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "NONE";

export class NetworkService {
  /**
   * Search professional B2B directory with server-side filtering & pagination
   */
  static async searchDirectory(
    input: NetworkDirectorySearchInput,
    currentUserId?: string
  ) {
    const {
      search,
      participantType,
      sector,
      category,
      state,
      district,
      verifiedOnly,
      page,
      pageSize,
      sortBy,
    } = input;

    const skip = (page - 1) * pageSize;
    const where: Prisma.NetworkProfileWhereInput = {};

    // 1. Participant Type
    if (participantType && participantType !== "ALL") {
      where.participantType = participantType;
    }

    // 2. Sector
    if (sector && sector !== "ALL") {
      where.sector = sector as Sector;
    }

    // 3. Category
    if (category) {
      where.businessCategory = { contains: category, mode: "insensitive" };
    }

    // 4. Location
    if (state) {
      where.state = { equals: state, mode: "insensitive" };
    }
    if (district) {
      where.district = { equals: district, mode: "insensitive" };
    }

    // 5. Verification Filter
    if (verifiedOnly) {
      where.isVerified = true;
    }

    // 6. Text Search across name, headline, bio, category
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { headline: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { businessCategory: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
      ];
    }

    // 7. Order By
    let orderBy: Prisma.NetworkProfileOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "connections") {
      orderBy = { connectionCount: "desc" };
    } else if (sortBy === "name") {
      orderBy = { displayName: "asc" };
    }

    const [profiles, total] = await Promise.all([
      prisma.networkProfile.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              role: true,
              farmerProfile: {
                select: {
                  experienceYears: true,
                  farms: { select: { id: true, name: true, sector: true, totalAreaAcres: true } },
                },
              },
              buyerProfile: {
                select: { companyName: true, buyerType: true },
              },
              products: {
                where: { status: "ACTIVE" },
                select: { id: true, title: true, category: true },
                take: 3,
              },
            },
          },
        },
      }),
      prisma.networkProfile.count({ where }),
    ]);

    // Compute connection statuses if user is authenticated
    let connectionMap = new Map<string, ConnectionStatusType>();
    if (currentUserId) {
      const [connections, sentReqs, receivedReqs] = await Promise.all([
        prisma.businessConnection.findMany({
          where: {
            OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
          },
        }),
        prisma.connectionRequest.findMany({
          where: { senderId: currentUserId, status: "PENDING" },
        }),
        prisma.connectionRequest.findMany({
          where: { receiverId: currentUserId, status: "PENDING" },
        }),
      ]);

      for (const conn of connections) {
        const otherId = conn.userAId === currentUserId ? conn.userBId : conn.userAId;
        connectionMap.set(otherId, "CONNECTED");
      }
      for (const req of sentReqs) {
        connectionMap.set(req.receiverId, "PENDING_SENT");
      }
      for (const req of receivedReqs) {
        connectionMap.set(req.senderId, "PENDING_RECEIVED");
      }
    }

    const formatted = profiles.map((p) => {
      let connStatus: ConnectionStatusType = "NONE";
      if (currentUserId) {
        if (p.userId === currentUserId) {
          connStatus = "SELF";
        } else if (connectionMap.has(p.userId)) {
          connStatus = connectionMap.get(p.userId)!;
        }
      }

      return {
        id: p.id,
        userId: p.userId,
        displayName: p.displayName,
        headline: p.headline,
        bio: p.bio,
        participantType: p.participantType || p.user.role,
        businessCategory: p.businessCategory,
        sector: p.sector,
        district: p.district || "Regional District",
        state: p.state || "India",
        avatarUrl: p.avatarUrl,
        websiteUrl: p.websiteUrl,
        isBusiness: p.isBusiness,
        isVerified: p.isVerified,
        connectionCount: p.connectionCount,
        role: p.user.role,
        activeListingsCount: p.user.products.length,
        featuredProducts: p.user.products,
        farms: p.user.farmerProfile?.farms || [],
        connectionStatus: connStatus,
      };
    });

    return {
      items: formatted,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Get single public network profile with safe field redaction
   */
  static async getPublicProfile(targetUserId: string, currentUserId?: string): Promise<any> {
    const profile = await prisma.networkProfile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
            farmerProfile: {
              select: {
                experienceYears: true,
                farms: { select: { id: true, name: true, sector: true, totalAreaAcres: true } },
              },
            },
            buyerProfile: {
              select: { companyName: true, buyerType: true },
            },
            products: {
              where: { status: "ACTIVE" },
              select: {
                id: true,
                slug: true,
                title: true,
                category: true,
                pricePerUnit: true,
                unit: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!profile) {
      // Create lazy profile if user exists
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          farmerProfile: {
            include: { farms: true },
          },
          buyerProfile: true,
          products: { where: { status: "ACTIVE" } },
        },
      });

      if (!user) {
        throw AppError.notFound("Network participant profile not found");
      }

      const newProfile = await prisma.networkProfile.create({
        data: {
          userId: user.id,
          displayName: user.fullName,
          headline: `${user.role} Member at Agri-Aqua Network`,
          participantType: user.role,
          sector: "AGRICULTURE",
          isVerified: user.status === "ACTIVE",
        },
      });

      return this.getPublicProfile(targetUserId, currentUserId);
    }

    // Determine connection status
    let connectionStatus: ConnectionStatusType = "NONE";
    let activeRequestId: string | null = null;

    if (currentUserId) {
      if (currentUserId === targetUserId) {
        connectionStatus = "SELF";
      } else {
        const [conn, sentReq, receivedReq] = await Promise.all([
          prisma.businessConnection.findFirst({
            where: {
              OR: [
                { userAId: currentUserId, userBId: targetUserId },
                { userAId: targetUserId, userBId: currentUserId },
              ],
            },
          }),
          prisma.connectionRequest.findFirst({
            where: {
              senderId: currentUserId,
              receiverId: targetUserId,
              status: "PENDING",
            },
          }),
          prisma.connectionRequest.findFirst({
            where: {
              senderId: targetUserId,
              receiverId: currentUserId,
              status: "PENDING",
            },
          }),
        ]);

        if (conn) {
          connectionStatus = "CONNECTED";
        } else if (sentReq) {
          connectionStatus = "PENDING_SENT";
          activeRequestId = sentReq.id;
        } else if (receivedReq) {
          connectionStatus = "PENDING_RECEIVED";
          activeRequestId = receivedReq.id;
        }
      }
    }

    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      headline: profile.headline,
      bio: profile.bio,
      participantType: profile.participantType || profile.user.role,
      businessCategory: profile.businessCategory,
      sector: profile.sector,
      district: profile.district || "Regional",
      state: profile.state || "India",
      avatarUrl: profile.avatarUrl,
      websiteUrl: profile.websiteUrl,
      isBusiness: profile.isBusiness,
      businessRegNumber: profile.businessRegNumber,
      isVerified: profile.isVerified,
      connectionCount: profile.connectionCount,
      role: profile.user.role,
      farmerInfo: profile.user.farmerProfile,
      buyerInfo: profile.user.buyerProfile,
      activeProducts: profile.user.products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        category: p.category,
        pricePerUnit: p.pricePerUnit.toNumber(),
        unit: p.unit,
        imageUrl: p.images[0]?.url,
      })),
      connectionStatus,
      activeRequestId,
    };
  }

  /**
   * Get user's own connections, received requests, and sent requests
   */
  static async getMyNetwork(currentUserId: string) {
    const [connections, receivedRequests, sentRequests] = await Promise.all([
      // 1. Established Connections
      prisma.businessConnection.findMany({
        where: {
          OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
        },
        include: {
          userA: {
            select: {
              id: true,
              fullName: true,
              role: true,
              networkProfile: true,
            },
          },
          userB: {
            select: {
              id: true,
              fullName: true,
              role: true,
              networkProfile: true,
            },
          },
        },
        orderBy: { establishedAt: "desc" },
      }),

      // 2. Received Requests (Pending)
      prisma.connectionRequest.findMany({
        where: { receiverId: currentUserId, status: "PENDING" },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              role: true,
              networkProfile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // 3. Sent Requests (Pending)
      prisma.connectionRequest.findMany({
        where: { senderId: currentUserId, status: "PENDING" },
        include: {
          receiver: {
            select: {
              id: true,
              fullName: true,
              role: true,
              networkProfile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const formattedConnections = connections.map((conn) => {
      const isUserA = conn.userAId === currentUserId;
      const peer = isUserA ? conn.userB : conn.userA;
      const profile = peer.networkProfile;

      return {
        id: conn.id,
        connectedUserId: peer.id,
        displayName: profile?.displayName || peer.fullName,
        headline: profile?.headline,
        participantType: profile?.participantType || peer.role,
        businessCategory: profile?.businessCategory,
        district: profile?.district,
        state: profile?.state,
        avatarUrl: profile?.avatarUrl,
        isVerified: profile?.isVerified ?? false,
        establishedAt: conn.establishedAt,
      };
    });

    const formattedReceived = receivedRequests.map((req) => ({
      id: req.id,
      senderId: req.senderId,
      displayName: req.sender.networkProfile?.displayName || req.sender.fullName,
      headline: req.sender.networkProfile?.headline,
      participantType: req.sender.networkProfile?.participantType || req.sender.role,
      message: req.message,
      createdAt: req.createdAt,
    }));

    const formattedSent = sentRequests.map((req) => ({
      id: req.id,
      receiverId: req.receiverId,
      displayName: req.receiver.networkProfile?.displayName || req.receiver.fullName,
      headline: req.receiver.networkProfile?.headline,
      participantType: req.receiver.networkProfile?.participantType || req.receiver.role,
      message: req.message,
      createdAt: req.createdAt,
    }));

    return {
      connections: formattedConnections,
      receivedRequests: formattedReceived,
      sentRequests: formattedSent,
      counts: {
        connectionsCount: formattedConnections.length,
        receivedCount: formattedReceived.length,
        sentCount: formattedSent.length,
      },
    };
  }

  /**
   * Send a professional connection request
   */
  static async sendConnectionRequest(
    senderId: string,
    input: SendConnectionRequestInput
  ) {
    if (senderId === input.targetUserId) {
      throw AppError.businessRule("You cannot send a connection request to yourself");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.targetUserId },
    });

    if (!targetUser || targetUser.status === "SUSPENDED") {
      throw AppError.notFound("Target business participant not found");
    }

    // Check if connection already exists
    const existingConn = await prisma.businessConnection.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: input.targetUserId },
          { userAId: input.targetUserId, userBId: senderId },
        ],
      },
    });

    if (existingConn) {
      throw AppError.businessRule("You are already connected with this participant");
    }

    // Check existing pending request
    const existingReq = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: input.targetUserId, status: "PENDING" },
          { senderId: input.targetUserId, receiverId: senderId, status: "PENDING" },
        ],
      },
    });

    if (existingReq) {
      throw AppError.businessRule("A pending connection request already exists between you");
    }

    const request = await prisma.$transaction(async (tx) => {
      const req = await tx.connectionRequest.upsert({
        where: {
          senderId_receiverId: {
            senderId,
            receiverId: input.targetUserId,
          },
        },
        create: {
          senderId,
          receiverId: input.targetUserId,
          status: "PENDING",
          message: input.message || null,
        },
        update: {
          status: "PENDING",
          message: input.message || null,
        },
      });

      // Receiver Notification
      await tx.notification.create({
        data: {
          userId: input.targetUserId,
          type: "CONNECTION_REQUEST",
          title: "New B2B Connection Request",
          body: "A professional participant has sent you a connection request.",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: senderId,
          action: "CONNECTION_REQUEST_CREATED",
          resource: "ConnectionRequest",
          resourceId: req.id,
          metadata: { targetUserId: input.targetUserId },
        },
      });

      return req;
    });

    return request;
  }

  /**
   * Accept a connection request (Receiver Only)
   */
  static async acceptConnectionRequest(receiverId: string, requestId: string) {
    const request = await prisma.connectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw AppError.notFound("Connection request not found");
    }

    if (request.receiverId !== receiverId) {
      throw AppError.forbidden("You do not have permission to accept this connection request");
    }

    if (request.status !== "PENDING") {
      throw AppError.businessRule(
        `Cannot accept request in "${request.status}" status`
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update request status
      const updatedReq = await tx.connectionRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });

      // 2. Create canonical BusinessConnection (userAId < userBId)
      const userAId = request.senderId < request.receiverId ? request.senderId : request.receiverId;
      const userBId = request.senderId < request.receiverId ? request.receiverId : request.senderId;

      await tx.businessConnection.upsert({
        where: {
          userAId_userBId: { userAId, userBId },
        },
        create: { userAId, userBId },
        update: { establishedAt: new Date() },
      });

      // 3. Increment connection count on both network profiles
      await tx.networkProfile.updateMany({
        where: { userId: { in: [request.senderId, request.receiverId] } },
        data: { connectionCount: { increment: 1 } },
      });

      // 4. Notification to Sender
      await tx.notification.create({
        data: {
          userId: request.senderId,
          type: "CONNECTION_REQUEST",
          title: "Connection Request Accepted",
          body: "Your professional connection request was accepted.",
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: receiverId,
          action: "CONNECTION_REQUEST_ACCEPTED",
          resource: "ConnectionRequest",
          resourceId: requestId,
          metadata: { senderId: request.senderId, receiverId },
        },
      });

      return updatedReq;
    });

    return result;
  }

  /**
   * Reject a connection request (Receiver Only)
   */
  static async rejectConnectionRequest(receiverId: string, requestId: string) {
    const request = await prisma.connectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw AppError.notFound("Connection request not found");
    }

    if (request.receiverId !== receiverId) {
      throw AppError.forbidden("You do not have permission to reject this connection request");
    }

    if (request.status !== "PENDING") {
      throw AppError.businessRule(`Cannot reject request in "${request.status}" status`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.connectionRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: receiverId,
          action: "CONNECTION_REQUEST_REJECTED",
          resource: "ConnectionRequest",
          resourceId: requestId,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Cancel a pending connection request (Sender Only)
   */
  static async cancelConnectionRequest(senderId: string, requestId: string) {
    const request = await prisma.connectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw AppError.notFound("Connection request not found");
    }

    if (request.senderId !== senderId) {
      throw AppError.forbidden("You do not have permission to cancel this connection request");
    }

    if (request.status !== "PENDING") {
      throw AppError.businessRule(`Cannot cancel request in "${request.status}" status`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.connectionRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: senderId,
          action: "CONNECTION_REQUEST_CANCELLED",
          resource: "ConnectionRequest",
          resourceId: requestId,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Remove an established connection
   */
  static async removeConnection(currentUserId: string, targetUserId: string) {
    const userAId = currentUserId < targetUserId ? currentUserId : targetUserId;
    const userBId = currentUserId < targetUserId ? targetUserId : currentUserId;

    const connection = await prisma.businessConnection.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });

    if (!connection) {
      throw AppError.notFound("Business connection not found");
    }

    await prisma.$transaction(async (tx) => {
      await tx.businessConnection.delete({
        where: { userAId_userBId: { userAId, userBId } },
      });

      await tx.networkProfile.updateMany({
        where: { userId: { in: [currentUserId, targetUserId] } },
        data: { connectionCount: { decrement: 1 } },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: currentUserId,
          action: "CONNECTION_REMOVED",
          resource: "BusinessConnection",
          resourceId: connection.id,
          metadata: { userAId, userBId },
        },
      });
    });

    return { success: true };
  }

  /**
   * Create a direct professional enquiry
   */
  static async createEnquiry(
    requesterId: string,
    input: CreateNetworkEnquiryInput
  ) {
    if (requesterId === input.targetUserId) {
      throw AppError.businessRule("You cannot send an enquiry to yourself");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.targetUserId },
    });

    if (!targetUser) {
      throw AppError.notFound("Target business participant not found");
    }

    const message = await prisma.$transaction(async (tx) => {
      // Find existing 2-party conversation or create new
      let conversation = await tx.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: requesterId } } },
            { participants: { some: { userId: input.targetUserId } } },
          ],
        },
      });

      if (!conversation) {
        conversation = await tx.conversation.create({
          data: {
            isGroup: false,
            participants: {
              create: [
                { userId: requesterId },
                { userId: input.targetUserId },
              ],
            },
          },
        });
      }

      // Create message with business enquiry context
      const msg = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: requesterId,
          content: input.content,
          contextType: "BUSINESS",
          contextId: input.targetUserId,
          contextSnapshot: (input.contextSnapshot as any) || undefined,
        },
      });

      // Target notification
      await tx.notification.create({
        data: {
          userId: input.targetUserId,
          type: "SYSTEM",
          title: "New B2B Business Enquiry",
          body: "You received a new commercial enquiry from a network participant.",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: requesterId,
          action: "NETWORK_ENQUIRY_CREATED",
          resource: "Message",
          resourceId: msg.id,
          metadata: { targetUserId: input.targetUserId },
        },
      });

      return msg;
    });

    return message;
  }

  /**
   * Get own network profile for editing
   */
  static async getOwnNetworkProfile(userId: string) {
    let profile = await prisma.networkProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw AppError.notFound("User not found");

      profile = await prisma.networkProfile.create({
        data: {
          userId: user.id,
          displayName: user.fullName,
          headline: `${user.role} Member at Agri-Aqua Network`,
          participantType: user.role,
          sector: "AGRICULTURE",
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              role: true,
              email: true,
              phone: true,
            },
          },
        },
      });
    }

    return profile;
  }

  /**
   * Update own network profile
   */
  static async updateOwnNetworkProfile(
    userId: string,
    input: UpdateNetworkProfileInput
  ) {
    const existing = await prisma.networkProfile.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const resolvedDisplayName = input.displayName || existing?.displayName || user?.fullName || "Participant";

    const profile = await prisma.$transaction(async (tx) => {
      const updated = await tx.networkProfile.upsert({
        where: { userId },
        create: {
          userId,
          displayName: resolvedDisplayName,
          headline: input.headline || null,
          bio: input.bio || null,
          participantType: input.participantType || null,
          businessCategory: input.businessCategory || null,
          sector: input.sector || null,
          district: input.district || null,
          state: input.state || null,
          avatarUrl: input.avatarUrl || null,
          websiteUrl: input.websiteUrl || null,
          isBusiness: input.isBusiness ?? false,
          businessRegNumber: input.businessRegNumber || null,
        },
        update: {
          ...(input.displayName ? { displayName: input.displayName } : {}),
          headline: input.headline !== undefined ? input.headline : undefined,
          bio: input.bio !== undefined ? input.bio : undefined,
          participantType: input.participantType !== undefined ? input.participantType : undefined,
          businessCategory: input.businessCategory !== undefined ? input.businessCategory : undefined,
          sector: input.sector !== undefined ? input.sector : undefined,
          district: input.district !== undefined ? input.district : undefined,
          state: input.state !== undefined ? input.state : undefined,
          avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : undefined,
          websiteUrl: input.websiteUrl !== undefined ? input.websiteUrl : undefined,
          isBusiness: input.isBusiness !== undefined ? input.isBusiness : undefined,
          businessRegNumber: input.businessRegNumber !== undefined ? input.businessRegNumber : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "NETWORK_PROFILE_UPDATED",
          resource: "NetworkProfile",
          resourceId: updated.id,
        },
      });

      return updated;
    });

    return profile;
  }
}
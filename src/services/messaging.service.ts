import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { messageEventBus } from "@/lib/events/message-bus";
import { MessageContextType, Prisma } from "@prisma/client";
import type {
  CreateDirectConversationInput,
  CreateContextualConversationInput,
  SendMessageInput,
  AttachmentPresignInput,
  MessageHistoryQueryInput,
} from "@/lib/validators/message.schema";

export class MessagingService {
  /**
   * Authorize conversation access: Verifies authenticated user is an active participant
   */
  static async validateConversationAccess(userId: string, conversationId: string) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      throw AppError.forbidden("You do not have permission to access this conversation");
    }

    return participant;
  }

  /**
   * Authorize & generate server-authoritative context snapshot
   */
  static async validateContextAccess(
    userId: string,
    contextType: MessageContextType,
    contextId: string,
    recipientUserId: string
  ): Promise<{ snapshot: any; defaultTitle: string }> {
    if (contextType === "PRODUCT") {
      const product = await prisma.product.findUnique({
        where: { id: contextId },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          seller: { select: { id: true, fullName: true } },
        },
      });

      if (!product) {
        throw AppError.notFound("Referenced marketplace product not found");
      }

      // Check legitimate parties: buyer contacting seller or seller responding
      const isSeller = product.sellerId === userId || product.sellerId === recipientUserId;
      if (!isSeller) {
        // Check if user is an agent assigned to the farmer
        const isAgent = await prisma.agentAssignment.findFirst({
          where: {
            targetUserId: product.sellerId,
            agentProfile: { userId },
            status: "ACTIVE",
          },
        });
        if (!isAgent) {
          throw AppError.forbidden("Unauthorized product communication relation");
        }
      }

      const snapshot = {
        type: "PRODUCT",
        id: product.id,
        title: product.title,
        price: product.pricePerUnit.toNumber(),
        unit: product.unit,
        thumbnail: product.images[0]?.url || null,
        sellerName: product.seller.fullName,
        sellerId: product.sellerId,
      };

      return { snapshot, defaultTitle: `Inquiry: ${product.title}` };
    }

    if (contextType === "ORDER") {
      const order = await prisma.order.findUnique({
        where: { id: contextId },
        include: {
          orderGroup: { select: { buyerId: true, orderNumber: true } },
          seller: { select: { id: true, fullName: true } },
        },
      });

      if (!order) {
        throw AppError.notFound("Referenced order not found");
      }

      const isBuyer = order.orderGroup.buyerId === userId || order.orderGroup.buyerId === recipientUserId;
      const isSeller = order.sellerId === userId || order.sellerId === recipientUserId;

      if (!isBuyer && !isSeller) {
        throw AppError.forbidden("Unauthorized order communication relation");
      }

      const snapshot = {
        type: "ORDER",
        id: order.id,
        orderNumber: order.subOrderNumber,
        status: order.status,
        total: order.sellerTotal.toNumber(),
        sellerName: order.seller.fullName,
      };

      return { snapshot, defaultTitle: `Order #${order.subOrderNumber}` };
    }

    if (contextType === "SERVICE") {
      const service = await prisma.serviceListing.findUnique({
        where: { id: contextId },
        include: {
          providerProfile: {
            include: { user: { select: { id: true, fullName: true } } },
          },
        },
      });

      if (!service) {
        throw AppError.notFound("Referenced service listing not found");
      }

      const providerUserId = service.providerProfile.userId;
      const isProvider = providerUserId === userId || providerUserId === recipientUserId;
      if (!isProvider) {
        throw AppError.forbidden("Unauthorized service communication relation");
      }

      const snapshot = {
        type: "SERVICE",
        id: service.id,
        title: service.title,
        providerName: service.providerProfile.businessName,
        status: service.status,
        basePrice: service.basePrice.toNumber(),
      };

      return { snapshot, defaultTitle: `Service: ${service.title}` };
    }

    if (contextType === "BUSINESS") {
      const targetUser = await prisma.user.findUnique({
        where: { id: recipientUserId },
        include: { networkProfile: true },
      });

      if (!targetUser) {
        throw AppError.notFound("Target business participant not found");
      }

      const snapshot = {
        type: "BUSINESS",
        id: targetUser.id,
        name: targetUser.networkProfile?.displayName || targetUser.fullName,
        participantType: targetUser.networkProfile?.participantType || targetUser.role,
        district: targetUser.networkProfile?.district || "Regional District",
        state: targetUser.networkProfile?.state || "India",
        isVerified: targetUser.networkProfile?.isVerified || false,
      };

      return { snapshot, defaultTitle: `Enquiry: ${snapshot.name}` };
    }

    return {
      snapshot: { type: "GENERAL" },
      defaultTitle: "Direct Message",
    };
  }

  /**
   * Get user's conversation list with unread counts and context badges
   */
  static async getConversations(userId: string) {
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                attachments: true,
              },
            },
          },
        },
      },
    });

    const items = await Promise.all(
      participants.map(async (p) => {
        const conv = p.conversation;
        const otherParticipants = conv.participants.filter((cp) => cp.userId !== userId);
        const otherUser = otherParticipants[0]?.user || null;
        const lastMessage = conv.messages[0] || null;

        // Calculate unread count securely
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isDeleted: false,
            ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
          },
        });

        return {
          id: conv.id,
          title: conv.title || (otherUser ? otherUser.fullName : "Direct Conversation"),
          isGroup: conv.isGroup,
          contextType: conv.contextType,
          contextId: conv.contextId,
          contextSnapshot: conv.contextSnapshot,
          otherUser: otherUser
            ? {
                id: otherUser.id,
                fullName: otherUser.fullName,
                email: otherUser.email,
                role: otherUser.role,
              }
            : null,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.isDeleted ? "Message deleted" : lastMessage.content,
                isDeleted: lastMessage.isDeleted,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
                hasAttachments: lastMessage.attachments.length > 0,
              }
            : null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    // Sort by latest activity
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return items;
  }

  /**
   * Get single conversation details
   */
  static async getConversationById(userId: string, conversationId: string) {
    const participant = await this.validateConversationAccess(userId, conversationId);
    const conv = participant.conversation;
    const otherParticipants = conv.participants.filter((cp) => cp.userId !== userId);
    const otherUser = otherParticipants[0]?.user || null;

    return {
      id: conv.id,
      title: conv.title || (otherUser ? otherUser.fullName : "Direct Conversation"),
      isGroup: conv.isGroup,
      contextType: conv.contextType,
      contextId: conv.contextId,
      contextSnapshot: conv.contextSnapshot,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            fullName: otherUser.fullName,
            email: otherUser.email,
            role: otherUser.role,
          }
        : null,
      participants: conv.participants.map((p) => ({
        userId: p.userId,
        fullName: p.user.fullName,
        role: p.user.role,
        lastReadAt: p.lastReadAt,
        joinedAt: p.joinedAt,
      })),
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  /**
   * Get paginated message history for an authorized conversation (Cursor-based)
   */
  static async getMessages(
    userId: string,
    conversationId: string,
    query: MessageHistoryQueryInput
  ) {
    await this.validateConversationAccess(userId, conversationId);

    const limit = Math.min(query.limit || 50, 100);
    const where: Prisma.MessageWhereInput = { conversationId };

    if (query.cursor) {
      const cursorMessage = await prisma.message.findUnique({
        where: { id: query.cursor },
      });

      if (cursorMessage) {
        if (query.direction === "after") {
          where.createdAt = { gt: cursorMessage.createdAt };
        } else {
          where.createdAt = { lt: cursorMessage.createdAt };
        }
      }
    }

    const messages = await prisma.message.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        attachments: true,
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

    const formatted = items.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.sender.fullName,
      senderRole: m.sender.role,
      content: m.isDeleted ? "Message deleted" : m.content,
      isDeleted: m.isDeleted,
      contextType: m.contextType,
      contextId: m.contextId,
      contextSnapshot: m.contextSnapshot,
      isOwn: m.senderId === userId,
      attachments: m.isDeleted
        ? []
        : m.attachments.map((a) => ({
            id: a.id,
            storageKey: a.storageKey,
            originalFileName: a.originalFileName,
            mimeType: a.mimeType,
            fileSizeBytes: a.fileSizeBytes,
          })),
      createdAt: m.createdAt,
    }));

    return {
      messages: formatted,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Send a message to an authorized conversation (Strict Authorization & SSE Publication)
   */
  static async sendMessage(userId: string, input: SendMessageInput) {
    const participant = await this.validateConversationAccess(userId, input.conversationId);
    const conv = participant.conversation;
    const recipientUserIds = conv.participants.map((p) => p.userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("Sender user not found");

    const message = await prisma.$transaction(async (tx) => {
      // 1. Create message with optional attachments
      const msg = await tx.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: userId,
          content: input.content,
          contextType: conv.contextType,
          contextId: conv.contextId,
          contextSnapshot: conv.contextSnapshot as any,
          attachments: input.attachments && input.attachments.length > 0
            ? {
                create: input.attachments.map((a) => ({
                  storageKey: a.storageKey,
                  originalFileName: a.originalFileName,
                  mimeType: a.mimeType,
                  fileSizeBytes: a.fileSizeBytes,
                })),
              }
            : undefined,
        },
        include: {
          sender: { select: { id: true, fullName: true, role: true } },
          attachments: true,
        },
      });

      // 2. Update conversation last active timestamp
      await tx.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      });

      // 3. Update sender's read timestamp
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId,
          },
        },
        data: { lastReadAt: new Date() },
      });

      // 4. Create in-app notifications for other participants
      const otherUserIds = recipientUserIds.filter((id) => id !== userId);
      for (const targetId of otherUserIds) {
        await tx.notification.create({
          data: {
            userId: targetId,
            type: "MESSAGE",
            title: `New message from ${user.fullName}`,
            body: input.content.length > 80 ? `${input.content.slice(0, 80)}...` : input.content,
            resourceType: "Conversation",
            resourceId: conv.id,
          },
        });
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "MESSAGE_SENT",
          resource: "Message",
          resourceId: msg.id,
          metadata: {
            conversationId: conv.id,
            attachmentCount: input.attachments?.length || 0,
          },
        },
      });

      return msg;
    });

    // 6. Realtime SSE Event Publish (after DB commit)
    const eventPayload = {
      type: "MESSAGE_CREATED" as const,
      eventId: message.id,
      conversationId: conv.id,
      timestamp: message.createdAt.toISOString(),
      data: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.sender.fullName,
        senderRole: message.sender.role,
        content: message.content,
        isDeleted: false,
        contextType: message.contextType,
        contextId: message.contextId,
        contextSnapshot: message.contextSnapshot,
        attachments: message.attachments.map((a) => ({
          id: a.id,
          storageKey: a.storageKey,
          originalFileName: a.originalFileName,
          mimeType: a.mimeType,
          fileSizeBytes: a.fileSizeBytes,
        })),
        createdAt: message.createdAt,
      },
    };

    messageEventBus.publish(recipientUserIds, eventPayload);

    return {
      ...message,
      isOwn: true,
    };
  }

  /**
   * Create direct 1-to-1 conversation
   */
  static async createDirectConversation(
    userId: string,
    input: CreateDirectConversationInput
  ) {
    if (userId === input.recipientUserId) {
      throw AppError.businessRule("You cannot start a conversation with yourself");
    }

    const recipient = await prisma.user.findUnique({
      where: { id: input.recipientUserId },
    });
    if (!recipient) {
      throw AppError.notFound("Recipient user not found");
    }

    // Check if direct conversation already exists between these 2 users
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        contextType: "GENERAL",
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: input.recipientUserId } } },
        ],
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    if (existing) {
      if (input.initialMessage) {
        await this.sendMessage(userId, {
          conversationId: existing.id,
          content: input.initialMessage,
        });
      }
      return existing;
    }

    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          title: null,
          isGroup: false,
          contextType: "GENERAL",
          participants: {
            create: [{ userId }, { userId: input.recipientUserId }],
          },
          messages: input.initialMessage
            ? {
                create: {
                  senderId: userId,
                  content: input.initialMessage,
                  contextType: "GENERAL",
                },
              }
            : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "CONVERSATION_CREATED",
          resource: "Conversation",
          resourceId: conv.id,
          metadata: { recipientUserId: input.recipientUserId, contextType: "GENERAL" },
        },
      });

      return conv;
    });

    // Notify recipient
    messageEventBus.publish([userId, input.recipientUserId], {
      type: "CONVERSATION_UPDATED",
      eventId: conversation.id,
      conversationId: conversation.id,
      timestamp: new Date().toISOString(),
      data: { conversationId: conversation.id },
    });

    return conversation;
  }

  /**
   * Create or find contextual conversation (Product, Order, Service, Business)
   */
  static async createContextualConversation(
    userId: string,
    input: CreateContextualConversationInput
  ) {
    if (userId === input.recipientUserId) {
      throw AppError.businessRule("You cannot start a conversation with yourself");
    }

    const recipient = await prisma.user.findUnique({
      where: { id: input.recipientUserId },
    });
    if (!recipient) {
      throw AppError.notFound("Recipient user not found");
    }

    // Authorize and compute server snapshot
    const { snapshot, defaultTitle } = await this.validateContextAccess(
      userId,
      input.contextType as MessageContextType,
      input.contextId,
      input.recipientUserId
    );

    // Look for matching conversation
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        contextType: input.contextType as MessageContextType,
        contextId: input.contextId,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: input.recipientUserId } } },
        ],
      },
    });

    if (existing) {
      if (input.initialMessage) {
        await this.sendMessage(userId, {
          conversationId: existing.id,
          content: input.initialMessage,
        });
      }
      return existing;
    }

    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          title: defaultTitle,
          isGroup: false,
          contextType: input.contextType as MessageContextType,
          contextId: input.contextId,
          contextSnapshot: snapshot,
          participants: {
            create: [
              { userId, lastReadAt: new Date() },
              { userId: input.recipientUserId, lastReadAt: null },
            ],
          },
          messages: {
            create: {
              senderId: userId,
              content: input.initialMessage,
              contextType: input.contextType as MessageContextType,
              contextId: input.contextId,
              contextSnapshot: snapshot,
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: input.recipientUserId,
          type: "MESSAGE",
          title: `New inquiry: ${defaultTitle}`,
          body: input.initialMessage.slice(0, 80),
          resourceType: "Conversation",
          resourceId: conv.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "CONVERSATION_CREATED",
          resource: "Conversation",
          resourceId: conv.id,
          metadata: {
            contextType: input.contextType,
            contextId: input.contextId,
            recipientUserId: input.recipientUserId,
          },
        },
      });

      return conv;
    });

    // Realtime notification
    messageEventBus.publish([userId, input.recipientUserId], {
      type: "CONVERSATION_UPDATED",
      eventId: conversation.id,
      conversationId: conversation.id,
      timestamp: new Date().toISOString(),
      data: { conversationId: conversation.id },
    });

    return conversation;
  }

  /**
   * Mark conversation as read
   */
  static async markConversationRead(userId: string, conversationId: string) {
    const participant = await this.validateConversationAccess(userId, conversationId);

    await prisma.$transaction(async (tx) => {
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: { lastReadAt: new Date() },
      });

      await tx.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });
    });

    // Publish read event
    const recipientUserIds = participant.conversation.participants.map((p) => p.userId);
    messageEventBus.publish(recipientUserIds, {
      type: "MESSAGE_READ",
      eventId: `read-${conversationId}-${Date.now()}`,
      conversationId,
      timestamp: new Date().toISOString(),
      data: { conversationId, readerUserId: userId },
    });

    return { success: true };
  }

  /**
   * Request presigned attachment upload metadata
   */
  static async getPresignedAttachmentUpload(
    userId: string,
    input: AttachmentPresignInput
  ) {
    const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const storageKey = `attachments/${userId}/${Date.now()}-${randomSuffix}-${sanitizedName}`;

    return {
      storageKey,
      uploadUrl: `/api/mock-upload/${storageKey}`,
      originalFileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
    };
  }

  /**
   * Soft-delete message (Sender Only)
   */
  static async softDeleteMessage(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: { include: { participants: true } },
      },
    });

    if (!message) {
      throw AppError.notFound("Message not found");
    }

    if (message.senderId !== userId) {
      throw AppError.forbidden("You can only delete your own messages");
    }

    if (message.isDeleted) {
      return { success: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "MESSAGE_DELETED",
          resource: "Message",
          resourceId: messageId,
        },
      });
    });

    const recipientUserIds = message.conversation.participants.map((p) => p.userId);
    messageEventBus.publish(recipientUserIds, {
      type: "MESSAGE_CREATED", // update client message feed
      eventId: `del-${messageId}`,
      conversationId: message.conversationId,
      timestamp: new Date().toISOString(),
      data: {
        id: messageId,
        conversationId: message.conversationId,
        isDeleted: true,
        content: "Message deleted",
      },
    });

    return { success: true };
  }
}

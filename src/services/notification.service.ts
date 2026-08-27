import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  NotificationChannel,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { notificationDispatcher } from "@/services/notification-channels";
import {
  InternalNotificationInput,
  InternalNotificationInputSchema,
  NotificationFilterInput,
  UpdateNotificationPreferenceInput,
} from "@/lib/validators/notification.schema";

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  "SYSTEM",
  "ORDER_UPDATE",
  "PAYMENT_UPDATE",
  "CONNECTION_REQUEST",
  "MESSAGE",
  "VERIFICATION_UPDATE",
  "PRODUCT_MODERATION",
  "SERVICE_UPDATE",
  "AGENT_UPDATE",
];

const ALL_CHANNELS: NotificationChannel[] = [
  "IN_APP",
  "EMAIL",
  "SMS",
  "WHATSAPP",
];

export class NotificationService {
  /**
   * Centralized server-side deep link resolver (Guarantees safe internal relative paths)
   */
  static resolveDeepLink(
    type: NotificationType,
    resourceType?: string | null,
    resourceId?: string | null,
    metadata?: Record<string, unknown>
  ): string {
    switch (type) {
      case "MESSAGE":
        return resourceId ? `/messages?conversationId=${encodeURIComponent(resourceId)}` : "/messages";
      case "ORDER_UPDATE":
        if (metadata && metadata.role === "SELLER") {
          return resourceId ? `/farmer/orders/${encodeURIComponent(resourceId)}` : "/farmer/orders";
        }
        return resourceId ? `/buyer/orders/${encodeURIComponent(resourceId)}` : "/buyer/orders";
      case "PAYMENT_UPDATE":
        return resourceId ? `/buyer/orders/${encodeURIComponent(resourceId)}` : "/buyer/orders";
      case "CONNECTION_REQUEST":
        return "/network/connections";
      case "SERVICE_UPDATE":
        if (metadata && typeof metadata.requestId === "string") {
          return `/services/request/${encodeURIComponent(metadata.requestId)}`;
        }
        return resourceId ? `/services/${encodeURIComponent(resourceId)}` : "/services";
      case "AGENT_UPDATE":
        if (metadata && metadata.target === "TASKS") {
          return "/agent/tasks";
        }
        return "/agent/leads";
      case "VERIFICATION_UPDATE":
        if (metadata && metadata.target === "AGENT") {
          return resourceId ? `/agent/verification/${encodeURIComponent(resourceId)}` : "/agent/tasks";
        }
        return "/farmer/profile";
      case "PRODUCT_MODERATION":
        return resourceId ? `/marketplace/${encodeURIComponent(resourceId)}` : "/marketplace";
      case "SYSTEM":
      default:
        return "/notifications";
    }
  }

  /**
   * Idempotent domain notification persistence and dispatch
   */
  static async createNotificationFromEvent(rawInput: InternalNotificationInput) {
    const validated = InternalNotificationInputSchema.parse(rawInput);

    // 1. Check idempotency if key provided
    if (validated.idempotencyKey) {
      const existing = await prisma.notification.findUnique({
        where: {
          userId_idempotencyKey: {
            userId: validated.userId,
            idempotencyKey: validated.idempotencyKey,
          },
        },
      });

      if (existing) {
        return existing;
      }
    }

    // 2. Resolve safe deep link
    const safeDeepLink = validated.deepLink?.startsWith("/")
      ? validated.deepLink
      : this.resolveDeepLink(
          validated.type,
          validated.resourceType,
          validated.resourceId,
          validated.metadata as Record<string, unknown>
        );

    // 3. Resolve user channel preferences
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        userId: validated.userId,
        type: validated.type,
      },
    });

    let enabledChannels: NotificationChannel[] = [];
    if (preferences.length > 0) {
      enabledChannels = preferences
        .filter((p) => p.isEnabled)
        .map((p) => p.channel);
    } else {
      // Default: IN_APP enabled; EMAIL enabled for high-priority transaction types
      enabledChannels.push("IN_APP");
      if (
        ["ORDER_UPDATE", "PAYMENT_UPDATE", "VERIFICATION_UPDATE", "MESSAGE"].includes(
          validated.type
        )
      ) {
        enabledChannels.push("EMAIL");
      }
    }

    // 4. Atomic database persistence
    const notification = await prisma.$transaction(async (tx) => {
      const notif = await tx.notification.create({
        data: {
          userId: validated.userId,
          type: validated.type,
          title: validated.title,
          body: validated.body,
          resourceType: validated.resourceType,
          resourceId: validated.resourceId,
          deepLink: safeDeepLink,
          idempotencyKey: validated.idempotencyKey,
          metadata: validated.metadata ? (validated.metadata as Prisma.InputJsonValue) : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: validated.userId,
          action: "NOTIFICATION_SENT",
          resource: "Notification",
          resourceId: notif.id,
          metadata: {
            type: validated.type,
            channels: enabledChannels,
            idempotencyKey: validated.idempotencyKey,
          },
        },
      });

      return notif;
    });

    // 5. Realtime Channel Dispatch (AFTER database commit)
    await notificationDispatcher.dispatch(
      {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        deepLink: notification.deepLink,
        resourceType: notification.resourceType,
        resourceId: notification.resourceId,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      },
      enabledChannels
    );

    return notification;
  }

  /**
   * Multi-recipient domain event notification generator
   */
  static async createNotificationsForRecipients(
    recipientUserIds: string[],
    template: Omit<InternalNotificationInput, "userId" | "idempotencyKey"> & {
      eventIdPrefix?: string;
    }
  ) {
    const uniqueRecipients = Array.from(new Set(recipientUserIds));
    const results = [];

    for (const recipientId of uniqueRecipients) {
      const idempotencyKey = template.eventIdPrefix
        ? `${template.eventIdPrefix}:${recipientId}`
        : undefined;

      const notif = await this.createNotificationFromEvent({
        ...template,
        userId: recipientId,
        idempotencyKey,
      });
      results.push(notif);
    }

    return results;
  }

  /**
   * Get user's notifications with server-side filters and pagination
   */
  static async getNotifications(userId: string, filter: NotificationFilterInput) {
    const page = filter.page || 1;
    const pageSize = Math.min(filter.pageSize || 20, 50);
    const skip = (page - 1) * pageSize;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(filter.unreadOnly ? { isRead: false } : {}),
      ...(filter.type ? { type: filter.type } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        readAt: n.readAt,
        deepLink: n.deepLink || this.resolveDeepLink(n.type, n.resourceType, n.resourceId, n.metadata as Record<string, unknown>),
        resourceType: n.resourceType,
        resourceId: n.resourceId,
        metadata: n.metadata,
        createdAt: n.createdAt,
      })),
      pagination: {
        total,
        unreadCount,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Get total unread notifications count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Mark individual notification as read (Strict recipient ownership check)
   */
  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw AppError.notFound("Notification not found");
    }

    if (notification.userId !== userId) {
      throw AppError.forbidden("You do not have permission to modify this notification");
    }

    if (notification.isRead) {
      return notification;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "NOTIFICATION_MARKED_READ",
          resource: "Notification",
          resourceId: notificationId,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Mark individual notification as unread (Strict recipient ownership check)
   */
  static async markAsUnread(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw AppError.notFound("Notification not found");
    }

    if (notification.userId !== userId) {
      throw AppError.forbidden("You do not have permission to modify this notification");
    }

    if (!notification.isRead) {
      return notification;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.notification.update({
        where: { id: notificationId },
        data: {
          isRead: false,
          readAt: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "NOTIFICATION_MARKED_UNREAD",
          resource: "Notification",
          resourceId: notificationId,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Mark all unread notifications read for the current user
   */
  static async markAllAsRead(userId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const updateRes = await tx.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "NOTIFICATIONS_MARKED_ALL_READ",
          resource: "Notification",
          metadata: { markedCount: updateRes.count },
        },
      });

      return updateRes;
    });

    return { count: result.count };
  }

  /**
   * Get user notification preferences matrix (Defaults initialized if not found)
   */
  static async getPreferences(userId: string) {
    const existing = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    const preferenceMap = new Map<string, boolean>();
    existing.forEach((p) => {
      preferenceMap.set(`${p.channel}_${p.type}`, p.isEnabled);
    });

    const matrix: Array<{
      channel: NotificationChannel;
      type: NotificationType;
      isEnabled: boolean;
    }> = [];

    for (const type of ALL_NOTIFICATION_TYPES) {
      for (const channel of ALL_CHANNELS) {
        const key = `${channel}_${type}`;
        if (preferenceMap.has(key)) {
          matrix.push({
            channel,
            type,
            isEnabled: preferenceMap.get(key)!,
          });
        } else {
          // Defaults:
          let defaultEnabled = false;
          if (channel === "IN_APP") {
            defaultEnabled = true;
          } else if (
            channel === "EMAIL" &&
            ["ORDER_UPDATE", "PAYMENT_UPDATE", "VERIFICATION_UPDATE", "MESSAGE"].includes(type)
          ) {
            defaultEnabled = true;
          }
          matrix.push({
            channel,
            type,
            isEnabled: defaultEnabled,
          });
        }
      }
    }

    return matrix;
  }

  /**
   * Update user notification preferences
   */
  static async updatePreferences(
    userId: string,
    input: UpdateNotificationPreferenceInput
  ) {
    await prisma.$transaction(async (tx) => {
      for (const pref of input.preferences) {
        await tx.notificationPreference.upsert({
          where: {
            userId_channel_type: {
              userId,
              channel: pref.channel,
              type: pref.type,
            },
          },
          create: {
            userId,
            channel: pref.channel,
            type: pref.type,
            isEnabled: pref.isEnabled,
          },
          update: {
            isEnabled: pref.isEnabled,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "NOTIFICATION_PREFERENCE_UPDATED",
          resource: "NotificationPreference",
          metadata: { updatedCount: input.preferences.length },
        },
      });
    });

    return this.getPreferences(userId);
  }
}

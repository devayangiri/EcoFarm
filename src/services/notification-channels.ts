import { NotificationChannel, NotificationType } from "@prisma/client";
import { messageEventBus } from "@/lib/events/message-bus";

export interface NotificationPayload {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  deepLink?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: any;
  createdAt: Date;
}

export interface ChannelDispatchResult {
  channel: NotificationChannel;
  success: boolean;
  isOperational: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationChannelHandler {
  readonly channel: NotificationChannel;
  readonly isOperational: boolean;
  send(notification: NotificationPayload): Promise<ChannelDispatchResult>;
}

/**
 * InApp Channel Handler: Primary operational realtime channel
 */
export class InAppChannelHandler implements NotificationChannelHandler {
  readonly channel: NotificationChannel = "IN_APP";
  readonly isOperational: boolean = true;

  async send(notification: NotificationPayload): Promise<ChannelDispatchResult> {
    try {
      messageEventBus.publish([notification.userId], {
        type: "NOTIFICATION_CREATED",
        eventId: notification.id,
        timestamp: notification.createdAt.toISOString(),
        data: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          deepLink: notification.deepLink,
          resourceType: notification.resourceType,
          resourceId: notification.resourceId,
          createdAt: notification.createdAt,
        },
      });

      return {
        channel: "IN_APP",
        success: true,
        isOperational: true,
        messageId: notification.id,
      };
    } catch (err: any) {
      return {
        channel: "IN_APP",
        success: false,
        isOperational: true,
        error: err.message || "Failed to publish in-app notification event",
      };
    }
  }
}

/**
 * Email Channel Handler: Extension Adapter (Stubbed/Unconfigured in V1)
 */
export class EmailChannelHandler implements NotificationChannelHandler {
  readonly channel: NotificationChannel = "EMAIL";
  readonly isOperational: boolean = false;

  async send(notification: NotificationPayload): Promise<ChannelDispatchResult> {
    // Extension point: SendGrid / AWS SES integration in future phase
    return {
      channel: "EMAIL",
      success: false,
      isOperational: false,
      error: "Email provider not configured in V1",
    };
  }
}

/**
 * SMS Channel Handler: Extension Adapter (Stubbed/Unconfigured in V1)
 */
export class SmsChannelHandler implements NotificationChannelHandler {
  readonly channel: NotificationChannel = "SMS";
  readonly isOperational: boolean = false;

  async send(notification: NotificationPayload): Promise<ChannelDispatchResult> {
    // Extension point: Twilio / Msg91 integration in future phase
    return {
      channel: "SMS",
      success: false,
      isOperational: false,
      error: "SMS provider not configured in V1",
    };
  }
}

/**
 * WhatsApp Channel Handler: Extension Adapter (Stubbed/Unconfigured in V1)
 */
export class WhatsAppChannelHandler implements NotificationChannelHandler {
  readonly channel: NotificationChannel = "WHATSAPP";
  readonly isOperational: boolean = false;

  async send(notification: NotificationPayload): Promise<ChannelDispatchResult> {
    // Extension point: WhatsApp Business API integration in future phase
    return {
      channel: "WHATSAPP",
      success: false,
      isOperational: false,
      error: "WhatsApp provider not configured in V1",
    };
  }
}

/**
 * Channel Dispatcher: Coordinates delivery across all registered channels
 */
export class NotificationChannelDispatcher {
  private handlers: Map<NotificationChannel, NotificationChannelHandler> = new Map();

  constructor() {
    this.registerHandler(new InAppChannelHandler());
    this.registerHandler(new EmailChannelHandler());
    this.registerHandler(new SmsChannelHandler());
    this.registerHandler(new WhatsAppChannelHandler());
  }

  public registerHandler(handler: NotificationChannelHandler) {
    this.handlers.set(handler.channel, handler);
  }

  public async dispatch(
    notification: NotificationPayload,
    enabledChannels: NotificationChannel[]
  ): Promise<ChannelDispatchResult[]> {
    const results: ChannelDispatchResult[] = [];

    for (const channel of enabledChannels) {
      const handler = this.handlers.get(channel);
      if (handler) {
        const result = await handler.send(notification);
        results.push(result);
      }
    }

    return results;
  }
}

export const notificationDispatcher = new NotificationChannelDispatcher();
import { EventEmitter } from "events";

export type MessageEventType =
  | "MESSAGE_CREATED"
  | "MESSAGE_READ"
  | "CONVERSATION_UPDATED"
  | "NOTIFICATION_CREATED";

export interface MessageEventPayload {
  type: MessageEventType;
  eventId: string;
  conversationId?: string;
  timestamp: string;
  data: any;
}

/**
 * MessageEventBus provides an in-process pub/sub event bus for realtime SSE downlink.
 *
 * NOTE FOR MULTI-INSTANCE PRODUCTION DEPLOYMENTS:
 * For multi-instance horizontal scaling, this in-memory bus can be replaced or backed
 * by a distributed Redis Pub/Sub, Kafka, or NATS broker without changing the consumer contracts.
 */
class MessageEventBusService {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(500); // Allow concurrent user SSE connections
  }

  /**
   * Subscribe to realtime events targeted for a specific user ID.
   * Returns an unsubscribe cleanup function.
   */
  public subscribe(userId: string, listener: (event: MessageEventPayload) => void): () => void {
    const channel = `user:${userId}`;
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }

  /**
   * Publish an event to one or more recipient user IDs.
   */
  public publish(targetUserIds: string[], event: MessageEventPayload): void {
    const uniqueRecipients = Array.from(new Set(targetUserIds));
    for (const userId of uniqueRecipients) {
      const channel = `user:${userId}`;
      this.emitter.emit(channel, event);
    }
  }
}

export const messageEventBus = new MessageEventBusService();
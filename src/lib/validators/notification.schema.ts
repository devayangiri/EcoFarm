import { z } from "zod";

export const NotificationTypeEnum = z.enum([
  "SYSTEM",
  "ORDER_UPDATE",
  "PAYMENT_UPDATE",
  "CONNECTION_REQUEST",
  "MESSAGE",
  "VERIFICATION_UPDATE",
  "PRODUCT_MODERATION",
  "SERVICE_UPDATE",
  "AGENT_UPDATE",
]);

export const NotificationChannelEnum = z.enum([
  "IN_APP",
  "EMAIL",
  "SMS",
  "WHATSAPP",
]);

export const NotificationFilterSchema = z.object({
  unreadOnly: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
  type: NotificationTypeEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const PreferenceItemSchema = z.object({
  channel: NotificationChannelEnum,
  type: NotificationTypeEnum,
  isEnabled: z.boolean(),
});

export const UpdateNotificationPreferenceSchema = z.object({
  preferences: z.array(PreferenceItemSchema).min(1, "At least one preference must be provided"),
});

export const InternalNotificationInputSchema = z.object({
  userId: z.string().trim().min(1, "Recipient user ID is required"),
  type: NotificationTypeEnum,
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Body is required").max(1000),
  resourceType: z.string().trim().max(100).optional(),
  resourceId: z.string().trim().max(100).optional(),
  deepLink: z.string().trim().max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().trim().max(255).optional(),
});

export type NotificationFilterInput = z.input<typeof NotificationFilterSchema>;
export type PreferenceItemInput = z.infer<typeof PreferenceItemSchema>;
export type UpdateNotificationPreferenceInput = z.infer<typeof UpdateNotificationPreferenceSchema>;
export type InternalNotificationInput = z.infer<typeof InternalNotificationInputSchema>;
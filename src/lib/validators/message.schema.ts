import { z } from "zod";

export const MessageContextTypeEnum = z.enum([
  "GENERAL",
  "PRODUCT",
  "ORDER",
  "SERVICE",
  "BUSINESS",
]);

export const CreateDirectConversationSchema = z.object({
  recipientUserId: z.string().uuid("Invalid recipient ID"),
  initialMessage: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters")
    .optional(),
});

export const CreateContextualConversationSchema = z.object({
  recipientUserId: z.string().uuid("Invalid recipient ID"),
  contextType: z.enum(["PRODUCT", "ORDER", "SERVICE", "BUSINESS"]),
  contextId: z.string().trim().min(1, "Context ID is required"),
  initialMessage: z
    .string()
    .trim()
    .min(1, "Initial message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
});

export const AttachmentItemSchema = z.object({
  storageKey: z.string().trim().min(1, "Storage key is required"),
  originalFileName: z.string().trim().min(1).max(255),
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, "Attachment cannot exceed 10MB"),
});

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
  attachments: z.array(AttachmentItemSchema).max(5, "Maximum 5 attachments per message").optional(),
});

export const AttachmentPresignSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(255),
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, "Attachment cannot exceed 10MB"),
});

export const MessageHistoryQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  direction: z.enum(["before", "after"]).optional().default("before"),
});

export type CreateDirectConversationInput = z.infer<typeof CreateDirectConversationSchema>;
export type CreateContextualConversationInput = z.infer<typeof CreateContextualConversationSchema>;
export type AttachmentItemInput = z.infer<typeof AttachmentItemSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type AttachmentPresignInput = z.infer<typeof AttachmentPresignSchema>;
export type MessageHistoryQueryInput = z.input<typeof MessageHistoryQuerySchema>;
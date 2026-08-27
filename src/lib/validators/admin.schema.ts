import { z } from "zod";

export const AdminUserFilterSchema = z.object({
  role: z.enum(["FARMER", "BUYER", "AGENT", "SERVICE_PROVIDER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"]).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const UpdateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED"]),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(500).optional(),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["FARMER", "BUYER", "AGENT", "SERVICE_PROVIDER", "ADMIN"]),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(500),
});

export const ProductModerationFilterSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_MODERATION", "ACTIVE", "PAUSED", "REJECTED", "ARCHIVED"]).optional(),
  sector: z.enum(["AGRICULTURE", "AQUACULTURE"]).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const ProductModerationActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "PAUSE", "RESTORE"]),
  reason: z.string().trim().max(500).optional(),
});

export const AssignVerificationSchema = z.object({
  reviewerId: z.string().uuid("Invalid reviewer user ID").nullable().optional(),
  reviewNotes: z.string().trim().max(500).optional(),
});

export const OrderSupervisionFilterSchema = z.object({
  status: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const OrderIssueActionSchema = z.object({
  action: z.enum(["CANCEL_ORDER", "RESOLVE_ISSUE", "REFUND_ORDER"]),
  reason: z.string().trim().min(5, "A clear operational reason is required").max(500),
});

export const DisputeFilterSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED", "ESCALATED", "CLOSED"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const DisputeUpdateSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED", "ESCALATED", "CLOSED"]),
  resolution: z.string().trim().min(5, "Resolution description is required").max(1000),
});

export const ReportFilterSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]).optional(),
  targetType: z.enum(["PRODUCT", "USER", "BUSINESS", "SERVICE", "MESSAGE", "REVIEW"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const ReportResolveSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
  resolutionNotes: z.string().trim().min(3, "Resolution notes required").max(1000),
});

export const ReviewFilterSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "HIDDEN", "REMOVED"]).optional(),
  targetType: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const ReviewModerationSchema = z.object({
  status: z.enum(["APPROVED", "HIDDEN", "REMOVED"]),
  moderationReason: z.string().trim().max(500).optional(),
});

export const AuditLogFilterSchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  actorUserId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const AdminSettingUpdateSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.record(z.unknown()),
  description: z.string().trim().max(255).optional(),
});

export const CreateReportInputSchema = z.object({
  targetType: z.enum(["PRODUCT", "USER", "BUSINESS", "SERVICE", "MESSAGE", "REVIEW"]),
  targetId: z.string().trim().min(1, "Target ID is required"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(200),
  description: z.string().trim().min(5, "Description must be at least 5 characters").max(1000),
});

export const CreateReviewInputSchema = z.object({
  targetType: z.enum(["PRODUCT", "SELLER", "SERVICE", "AGENT"]),
  targetId: z.string().trim().min(1, "Target ID is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type AdminUserFilterInput = z.input<typeof AdminUserFilterSchema>;
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type ProductModerationFilterInput = z.input<typeof ProductModerationFilterSchema>;
export type ProductModerationActionInput = z.infer<typeof ProductModerationActionSchema>;
export type AssignVerificationInput = z.infer<typeof AssignVerificationSchema>;
export type OrderSupervisionFilterInput = z.input<typeof OrderSupervisionFilterSchema>;
export type OrderIssueActionInput = z.infer<typeof OrderIssueActionSchema>;
export type DisputeFilterInput = z.input<typeof DisputeFilterSchema>;
export type DisputeUpdateInput = z.infer<typeof DisputeUpdateSchema>;
export type ReportFilterInput = z.input<typeof ReportFilterSchema>;
export type ReportResolveInput = z.infer<typeof ReportResolveSchema>;
export type ReviewFilterInput = z.input<typeof ReviewFilterSchema>;
export type ReviewModerationInput = z.infer<typeof ReviewModerationSchema>;
export type AuditLogFilterInput = z.input<typeof AuditLogFilterSchema>;
export type AdminSettingUpdateInput = z.infer<typeof AdminSettingUpdateSchema>;
export type CreateReportInput = z.infer<typeof CreateReportInputSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;
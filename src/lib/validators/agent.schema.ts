import { z } from "zod";

export const LeadStageEnum = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "CONVERTED",
  "LOST",
]);

export const LeadActivityTypeEnum = z.enum([
  "CALL",
  "MESSAGE",
  "MEETING",
  "NOTE",
  "FOLLOW_UP",
  "STATUS_CHANGE",
]);

export const TaskPriorityEnum = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const TaskStatusEnum = z.enum([
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const AgentTargetTypeEnum = z.enum([
  "FARMER",
  "BUYER",
  "BUSINESS",
]);

export const VerificationActionEnum = z.enum([
  "START_REVIEW",
  "APPROVE",
  "REQUEST_CHANGES",
  "REJECT",
]);

export const CreateLeadSchema = z.object({
  contactName: z.string().trim().min(2, "Contact name is required").max(100),
  contactPhone: z.string().trim().optional().nullable(),
  contactEmail: z.string().trim().email("Invalid email format").optional().nullable().or(z.literal("")),
  source: z.string().trim().max(50).optional().nullable(),
  targetSector: z.enum(["AGRICULTURE", "AQUACULTURE"]).default("AGRICULTURE"),
  stage: LeadStageEnum.default("NEW"),
  estimatedValue: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export const TransitionLeadStageSchema = z.object({
  stage: LeadStageEnum,
  note: z.string().trim().max(500).optional().nullable(),
});

export const CreateLeadActivitySchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  type: LeadActivityTypeEnum,
  note: z.string().trim().min(2, "Activity note is required").max(1000),
});

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(3, "Task title must be at least 3 characters").max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  dueDate: z.coerce.date(),
  priority: TaskPriorityEnum.default("MEDIUM"),
  linkedLeadId: z.string().uuid().optional().nullable().or(z.literal("")),
  linkedTargetType: AgentTargetTypeEnum.optional().nullable(),
  linkedTargetUserId: z.string().uuid().optional().nullable().or(z.literal("")),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  status: TaskStatusEnum.optional(),
});

export const CreateAgentNoteSchema = z.object({
  targetType: AgentTargetTypeEnum,
  targetUserId: z.string().uuid("Invalid target user ID"),
  content: z.string().trim().min(3, "Note content must be at least 3 characters").max(2000),
});

export const ReviewVerificationSchema = z.object({
  action: VerificationActionEnum,
  reviewNotes: z.string().trim().max(1000).optional().nullable(),
});

export const UpdateAgentProfileSchema = z.object({
  assignedRegionState: z.string().trim().min(2).max(80).optional(),
  assignedDistricts: z.array(z.string().trim()).optional(),
});

export const AgentSearchFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional().default("ALL"),
  sector: z.string().trim().optional().default("ALL"),
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type TransitionLeadStageInput = z.infer<typeof TransitionLeadStageSchema>;
export type CreateLeadActivityInput = z.infer<typeof CreateLeadActivitySchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateAgentNoteInput = z.infer<typeof CreateAgentNoteSchema>;
export type ReviewVerificationInput = z.infer<typeof ReviewVerificationSchema>;
export type UpdateAgentProfileInput = z.infer<typeof UpdateAgentProfileSchema>;
export type AgentSearchFilterInput = z.input<typeof AgentSearchFilterSchema>;
import { z } from "zod";

export const NetworkDirectorySearchSchema = z.object({
  search: z.string().trim().optional(),
  participantType: z.string().optional().default("ALL"),
  sector: z.enum(["ALL", "AGRICULTURE", "AQUACULTURE"]).optional().default("ALL"),
  category: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  verifiedOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === "true"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  sortBy: z.enum(["newest", "connections", "name"]).default("newest"),
});

export const SendConnectionRequestSchema = z.object({
  targetUserId: z.string().uuid("Invalid target user ID"),
  message: z.string().trim().max(500, "Message cannot exceed 500 characters").optional(),
});

export const CreateNetworkEnquirySchema = z.object({
  targetUserId: z.string().uuid("Invalid target user ID"),
  content: z
    .string()
    .trim()
    .min(10, "Enquiry must contain at least 10 characters")
    .max(1000, "Enquiry cannot exceed 1000 characters"),
  contextSnapshot: z.record(z.any()).optional(),
});

export const UpdateNetworkProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters").max(100).optional(),
  headline: z.string().trim().max(150, "Headline cannot exceed 150 characters").optional().nullable(),
  bio: z.string().trim().max(1000, "Bio cannot exceed 1000 characters").optional().nullable(),
  participantType: z.string().trim().max(50).optional().nullable(),
  businessCategory: z.string().trim().max(80).optional().nullable(),
  sector: z.enum(["AGRICULTURE", "AQUACULTURE"]).optional().nullable(),
  district: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(80).optional().nullable(),
  avatarUrl: z.string().url("Invalid avatar image URL").optional().nullable().or(z.literal("")),
  websiteUrl: z.string().url("Invalid website URL").optional().nullable().or(z.literal("")),
  isBusiness: z.boolean().optional(),
  businessRegNumber: z.string().trim().max(50).optional().nullable(),
});

export type NetworkDirectorySearchInput = z.infer<typeof NetworkDirectorySearchSchema>;
export type SendConnectionRequestInput = z.infer<typeof SendConnectionRequestSchema>;
export type CreateNetworkEnquiryInput = z.infer<typeof CreateNetworkEnquirySchema>;
export type UpdateNetworkProfileInput = z.infer<typeof UpdateNetworkProfileSchema>;
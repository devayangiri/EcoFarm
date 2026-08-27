import { z } from "zod";

export const UpdateFarmerProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100)
    .trim()
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Please provide a valid contact number")
    .optional()
    .nullable(),
  experienceYears: z
    .number()
    .int()
    .nonnegative("Experience cannot be negative")
    .max(70, "Experience cannot exceed 70 years")
    .optional(),
  avatarUrl: z.string().url("Valid avatar URL required").optional().nullable(),
  villageOrStreet: z.string().max(150).trim().optional(),
  cityOrTown: z.string().max(100).trim().optional(),
  district: z.string().max(80).trim().optional(),
  state: z.string().max(80).trim().optional(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code")
    .optional()
    .nullable(),
});

export type UpdateFarmerProfileInput = z.infer<typeof UpdateFarmerProfileSchema>;

import { z } from "zod";
import { SectorEnum } from "./product.schema";

export const BuyerTypeEnum = z.enum([
  "INDIVIDUAL",
  "WHOLESALER",
  "RETAILER",
  "PROCESSOR",
  "EXPORTER",
  "INSTITUTION",
  "OTHER",
]);

export const RequirementStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "CLOSED",
  "CANCELLED",
]);

export const UpdateBuyerProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100)
    .trim()
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, "Please provide a valid phone number")
    .optional()
    .nullable(),
  companyName: z.string().max(120).trim().optional().nullable(),
  buyerType: BuyerTypeEnum.optional(),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format")
    .optional()
    .nullable(),
  villageOrStreet: z.string().max(150).trim().optional(),
  cityOrTown: z.string().max(100).trim().optional(),
  district: z.string().max(80).trim().optional(),
  state: z.string().max(80).trim().optional(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code")
    .optional()
    .nullable(),
});

export const CreateRequirementSchema = z.object({
  title: z
    .string({ required_error: "Requirement title is required" })
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters")
    .trim(),
  sector: SectorEnum.default("AGRICULTURE"),
  category: z
    .string({ required_error: "Category is required" })
    .min(2, "Category is required")
    .max(60)
    .trim(),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters")
    .max(3000)
    .trim(),
  quantity: z
    .number({ required_error: "Required quantity is required" })
    .positive("Quantity must be greater than zero"),
  unit: z
    .string({ required_error: "Unit of measure is required" })
    .min(1)
    .max(30)
    .toUpperCase()
    .trim(),
  targetPricePerUnit: z
    .number()
    .positive("Target price must be positive")
    .optional()
    .nullable(),
  locationDistrict: z
    .string({ required_error: "District is required" })
    .min(2)
    .max(80)
    .trim(),
  locationState: z
    .string({ required_error: "State is required" })
    .min(2)
    .max(80)
    .trim(),
  deliveryExpectation: z.string().max(100).optional().nullable(),
});

export const UpdateRequirementSchema = CreateRequirementSchema.partial().extend({
  status: RequirementStatusEnum.optional(),
});

export const CreateProductInquirySchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  message: z
    .string({ required_error: "Inquiry message is required" })
    .min(5, "Inquiry message must be at least 5 characters")
    .max(2000)
    .trim(),
});

export type UpdateBuyerProfileInput = z.infer<typeof UpdateBuyerProfileSchema>;
export type CreateRequirementInput = z.infer<typeof CreateRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof UpdateRequirementSchema>;
export type CreateProductInquiryInput = z.infer<typeof CreateProductInquirySchema>;
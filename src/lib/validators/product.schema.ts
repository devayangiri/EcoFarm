import { z } from "zod";

export const SectorEnum = z.enum(["AGRICULTURE", "AQUACULTURE"]);
export const ProductStatusEnum = z.enum([
  "DRAFT",
  "PENDING_MODERATION",
  "ACTIVE",
  "PAUSED",
  "OUT_OF_STOCK",
  "ARCHIVED",
]);

export const ProductImageInputSchema = z.object({
  url: z.string().url("Valid image URL required"),
  altText: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const CreateProductSchema = z.object({
  title: z
    .string({ required_error: "Product title is required" })
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters")
    .trim(),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters")
    .max(3000, "Description cannot exceed 3000 characters")
    .trim(),
  sector: SectorEnum,
  category: z
    .string({ required_error: "Category is required" })
    .min(2, "Category is required")
    .max(60)
    .trim(),
  variety: z.string().max(100).optional().nullable(),
  pricePerUnit: z
    .number({ required_error: "Price is required" })
    .positive("Price must be greater than zero")
    .max(10000000, "Price exceeds maximum allowable limit"),
  unit: z
    .string({ required_error: "Unit of measure is required" })
    .min(1, "Unit is required")
    .max(30)
    .toUpperCase()
    .trim(),
  minimumOrderQuantity: z
    .number({ required_error: "Minimum order quantity is required" })
    .positive("MOQ must be at least 1")
    .default(1),
  availableStock: z
    .number({ required_error: "Available stock is required" })
    .nonnegative("Stock cannot be negative"),
  harvestDate: z.string().datetime().optional().nullable(),
  locationDistrict: z
    .string({ required_error: "District location is required" })
    .min(2, "District is required")
    .max(80)
    .trim(),
  locationState: z
    .string({ required_error: "State location is required" })
    .min(2, "State is required")
    .max(80)
    .trim(),
  images: z.array(ProductImageInputSchema).max(8, "Maximum 8 images allowed").default([]),
  submitForModeration: z.boolean().default(false),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductFilterSchema = z.object({
  search: z.string().optional(),
  status: ProductStatusEnum.optional(),
  sector: SectorEnum.optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortBy: z.enum(["newest", "price_asc", "price_desc", "stock_desc", "title"]).default("newest"),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductFilterInput = z.infer<typeof ProductFilterSchema>;

import { z } from "zod";

export const ServiceCategoryEnum = z.enum([
  "MACHINERY_RENTAL",
  "STORAGE",
  "COLD_STORAGE",
  "LOGISTICS",
  "TRANSPORT",
  "LABOR",
  "SOIL_TESTING",
  "WATER_TESTING",
  "AGRICULTURE_SERVICE",
  "AQUACULTURE_SERVICE",
  "CONSULTING",
  "OTHER",
]);

export const PricingModelEnum = z.enum([
  "HOURLY",
  "DAILY",
  "PER_ACRE",
  "PER_TON",
  "FIXED",
]);

export const ServiceDirectorySearchSchema = z.object({
  search: z.string().trim().optional(),
  category: z.union([ServiceCategoryEnum, z.literal("ALL")]).optional().default("ALL"),
  sector: z.enum(["ALL", "AGRICULTURE", "AQUACULTURE"]).optional().default("ALL"),
  pricingModel: z.string().optional().default("ALL"),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  verifiedOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === "true"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  sortBy: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
});

export const CreateServiceListingSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  category: ServiceCategoryEnum,
  sector: z.enum(["AGRICULTURE", "AQUACULTURE"]).default("AGRICULTURE"),
  pricingModel: PricingModelEnum,
  basePrice: z.coerce.number().positive("Base price must be positive"),
  coverImageUrl: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
  serviceArea: z.string().trim().max(100).optional().nullable(),
  locationDistrict: z.string().trim().min(2, "District is required").max(80),
  locationState: z.string().trim().min(2, "State is required").max(80),
});

export const UpdateServiceListingSchema = CreateServiceListingSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

export const CreateServiceRequestSchema = z.object({
  serviceId: z.string().uuid("Invalid service ID"),
  requiredDate: z.coerce.date().refine((d) => d >= new Date(Date.now() - 86400000), {
    message: "Required service date cannot be in the past",
  }),
  quantityOrScale: z.string().trim().min(1, "Quantity/Scale is required").max(50),
  requirements: z.string().trim().min(10, "Please provide detailed service requirements").max(1000),
  locationVillageOrStreet: z.string().trim().max(100).optional().nullable(),
  locationCityOrTown: z.string().trim().min(2, "City/Town is required").max(80),
  locationDistrict: z.string().trim().min(2, "District is required").max(80),
  locationState: z.string().trim().min(2, "State is required").max(80),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const CreateServiceQuotationSchema = z.object({
  serviceRequestId: z.string().uuid("Invalid service request ID"),
  amount: z.coerce.number().positive("Quotation amount must be greater than zero"),
  validUntil: z.coerce.date().refine((d) => d > new Date(), {
    message: "Quotation validity date must be in the future",
  }),
  terms: z.string().trim().max(1000).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const UpdateServiceExecutionStatusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  note: z.string().trim().max(500).optional(),
});

export type ServiceDirectorySearchInput = z.infer<typeof ServiceDirectorySearchSchema>;
export type CreateServiceListingInput = z.infer<typeof CreateServiceListingSchema>;
export type UpdateServiceListingInput = z.infer<typeof UpdateServiceListingSchema>;
export type CreateServiceRequestInput = z.infer<typeof CreateServiceRequestSchema>;
export type CreateServiceQuotationInput = z.infer<typeof CreateServiceQuotationSchema>;
export type UpdateServiceExecutionStatusInput = z.infer<typeof UpdateServiceExecutionStatusSchema>;
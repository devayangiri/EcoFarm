import { z } from "zod";
import { SectorEnum } from "./product.schema";

export const CreateFarmSchema = z.object({
  name: z
    .string({ required_error: "Farm name is required" })
    .min(2, "Farm name must be at least 2 characters")
    .max(100)
    .trim(),
  sector: SectorEnum.default("AGRICULTURE"),
  totalAreaAcres: z
    .number({ required_error: "Total area in acres is required" })
    .positive("Area must be greater than zero")
    .max(100000, "Area exceeds maximum value"),
  waterSourceType: z.string().max(100).optional().nullable(),
  soilType: z.string().max(100).optional().nullable(),
  villageOrStreet: z
    .string({ required_error: "Village/Street is required" })
    .min(2, "Village or Street is required")
    .max(150)
    .trim(),
  cityOrTown: z
    .string({ required_error: "City/Town is required" })
    .min(2, "City or Town is required")
    .max(100)
    .trim(),
  district: z
    .string({ required_error: "District is required" })
    .min(2, "District is required")
    .max(80)
    .trim(),
  state: z
    .string({ required_error: "State is required" })
    .min(2, "State is required")
    .max(80)
    .trim(),
  pincode: z
    .string({ required_error: "Pincode is required" })
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code"),
});

export const UpdateFarmSchema = CreateFarmSchema.partial();

export type CreateFarmInput = z.infer<typeof CreateFarmSchema>;
export type UpdateFarmInput = z.infer<typeof UpdateFarmSchema>;

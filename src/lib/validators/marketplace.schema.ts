import { z } from "zod";

export const SectorFilterEnum = z.enum(["ALL", "AGRICULTURE", "AQUACULTURE"]).default("ALL");

export const MarketplaceSearchSchema = z.object({
  search: z.string().optional(),
  sector: SectorFilterEnum,
  category: z.string().optional(),
  variety: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minMoq: z.coerce.number().positive().optional(),
  maxMoq: z.coerce.number().positive().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  inStockOnly: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .default(false),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  sortBy: z
    .enum(["relevance", "newest", "price_asc", "price_desc", "stock_desc", "title"])
    .default("newest"),
});

export type MarketplaceSearchInput = z.infer<typeof MarketplaceSearchSchema>;
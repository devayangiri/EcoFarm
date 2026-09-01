import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketplaceService } from "@/services/marketplace.service";
import { MarketplaceSearchSchema } from "@/lib/validators/marketplace.schema";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    userProductBookmark: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

describe("Public Data Consistency & Route Integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Product Detail Resolution (UUID & Slug)", () => {
    it("should resolve a product by its real database UUID", async () => {
      const mockUuid = "11111111-2222-3333-4444-555555555555";
      const mockProduct = {
        id: mockUuid,
        slug: "swarna-paddy-grain-grade-a-purba-bardhaman",
        title: "Swarna High-Yield Paddy Grain (Grade A)",
        description: "Direct-from-farm freshly harvested Swarna paddy grain.",
        sector: "AGRICULTURE",
        category: "Cereals & Grains",
        variety: "Swarna (MTU 7029)",
        pricePerUnit: { toNumber: () => 2180.0 },
        unit: "QUINTAL",
        minimumOrderQuantity: { toNumber: () => 10 },
        availableStock: { toNumber: () => 500 },
        reservedStock: { toNumber: () => 0 },
        harvestDate: new Date(),
        locationDistrict: "Purba Bardhaman",
        locationState: "West Bengal",
        status: "ACTIVE",
        images: [{ url: "https://images.unsplash.com/photo-1" }],
        seller: {
          id: "farmer-uuid-1",
          fullName: "Ramesh Kumar",
          farmerProfile: { isVerified: true, experienceYears: 14 },
        },
      };

      (prisma.product.findFirst as any).mockResolvedValue(mockProduct);

      const result = await MarketplaceService.getProductDetails(mockUuid);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUuid);
      expect(result.title).toBe("Swarna High-Yield Paddy Grain (Grade A)");
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: mockUuid }, { slug: mockUuid }],
          status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
        },
        include: expect.any(Object),
      });
    });

    it("should resolve a product by its persistent slug", async () => {
      const mockSlug = "live-premium-rohu-freshwater-fish";
      const mockProduct = {
        id: "22222222-3333-4444-5555-666666666666",
        slug: mockSlug,
        title: "Live Premium Rohu Fish",
        pricePerUnit: { toNumber: () => 185.0 },
        minimumOrderQuantity: { toNumber: () => 50 },
        availableStock: { toNumber: () => 8000 },
        reservedStock: { toNumber: () => 0 },
        status: "ACTIVE",
        images: [],
        seller: {
          id: "farmer-uuid-1",
          fullName: "Ramesh Kumar",
          farmerProfile: { isVerified: true, experienceYears: 14 },
        },
      };

      (prisma.product.findFirst as any).mockResolvedValue(mockProduct);

      const result = await MarketplaceService.getProductDetails(mockSlug);
      expect(result).toBeDefined();
      expect(result.slug).toBe(mockSlug);
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: undefined }, { slug: mockSlug }],
          status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
        },
        include: expect.any(Object),
      });
    });

    it("should return 404 AppError when fake synthetic ID like 'feat-1' does not exist", async () => {
      (prisma.product.findFirst as any).mockResolvedValue(null);

      await expect(MarketplaceService.getProductDetails("feat-1")).rejects.toThrow(AppError);
      await expect(MarketplaceService.getProductDetails("feat-1")).rejects.toMatchObject({
        statusCode: 404,
        code: "NOT_FOUND",
      });
    });
  });

  describe("2. Single Source of Truth for Homepage & Marketplace", () => {
    it("should query only ACTIVE or OUT_OF_STOCK products and exclude DRAFT or ARCHIVED", async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);
      (prisma.product.count as any).mockResolvedValue(0);

      await MarketplaceService.searchProducts(
        MarketplaceSearchSchema.parse({
          page: 1,
          pageSize: 3,
          sortBy: "newest",
        })
      );

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
          }),
        })
      );
    });
  });

  describe("3. Trust-Copy & Marketing Verification", () => {
    it("should verify LandingHero and HomePage do not include unverified absolute metrics", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const heroPath = path.join(process.cwd(), "src", "components", "public", "landing-hero.tsx");
      const heroContent = fs.readFileSync(heroPath, "utf8");

      expect(heroContent).not.toContain("0% Fraud");
      expect(heroContent).not.toContain("500+ MT");
      expect(heroContent).not.toContain("100% Live");

      const homePath = path.join(process.cwd(), "src", "app", "page.tsx");
      const homeContent = fs.readFileSync(homePath, "utf8");

      expect(homeContent).not.toContain("feat-1");
      expect(homeContent).not.toContain("feat-2");
      expect(homeContent).not.toContain("feat-3");
      expect(homeContent).not.toContain("500+ Commodities");
    });
  });
});

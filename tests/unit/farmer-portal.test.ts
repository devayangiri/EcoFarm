import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductService } from "@/services/product.service";
import { FarmService } from "@/services/farm.service";
import { FarmerProfileService } from "@/services/farmer-profile.service";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

// Mock Prisma for isolated unit tests
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      farmerProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      farm: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      productImage: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      address: {
        create: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    },
  };
});

describe("Phase 5: Farmer Portal & Product Management Test Suite", () => {
  const mockFarmerId1 = "farmer-user-1";
  const mockFarmerId2 = "farmer-user-2";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Product Creation & Draft Saving", () => {
    it("should allow an active farmer to create a product in DRAFT status", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: mockFarmerId1,
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.product.create).mockResolvedValue({
        id: "prod-101",
        sellerId: mockFarmerId1,
        title: "Fresh Swarna Paddy",
        slug: "fresh-swarna-paddy-12345",
        status: "DRAFT",
        pricePerUnit: new Prisma.Decimal(2200),
        availableStock: new Prisma.Decimal(100),
      } as any);

      const result = await ProductService.createProduct(mockFarmerId1, {
        title: "Fresh Swarna Paddy",
        description: "High quality grade A harvested paddy crop.",
        sector: "AGRICULTURE",
        category: "Cereals & Grains",
        pricePerUnit: 2200,
        unit: "QUINTAL",
        minimumOrderQuantity: 5,
        availableStock: 100,
        locationDistrict: "Purba Bardhaman",
        locationState: "West Bengal",
        images: [],
        submitForModeration: false,
      });

      expect(result.id).toBe("prod-101");
      expect(result.status).toBe("DRAFT");
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it("should create product in PENDING_MODERATION when submitForModeration is true", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: mockFarmerId1,
        status: "ACTIVE",
      } as any);

      vi.mocked(prisma.product.create).mockResolvedValue({
        id: "prod-102",
        sellerId: mockFarmerId1,
        title: "Live Rohu Fish",
        status: "PENDING_MODERATION",
        pricePerUnit: new Prisma.Decimal(190),
        availableStock: new Prisma.Decimal(500),
      } as any);

      const result = await ProductService.createProduct(mockFarmerId1, {
        title: "Live Rohu Fish",
        description: "Freshly harvested live freshwater carp.",
        sector: "AQUACULTURE",
        category: "Freshwater Fish",
        pricePerUnit: 190,
        unit: "KG",
        minimumOrderQuantity: 10,
        availableStock: 500,
        locationDistrict: "Purba Bardhaman",
        locationState: "West Bengal",
        images: [],
        submitForModeration: true,
      });

      expect(result.status).toBe("PENDING_MODERATION");
    });

    it("should reject product creation if farmer account is SUSPENDED", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: mockFarmerId1,
        status: "SUSPENDED",
      } as any);

      await expect(
        ProductService.createProduct(mockFarmerId1, {
          title: "Suspended Farmer Crop",
          description: "This should fail due to account status.",
          sector: "AGRICULTURE",
          category: "Cereals",
          pricePerUnit: 1000,
          unit: "KG",
          minimumOrderQuantity: 1,
          availableStock: 10,
          locationDistrict: "Hooghly",
          locationState: "West Bengal",
          images: [],
          submitForModeration: false,
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe("2. Security & IDOR / BOLA Ownership Boundaries", () => {
    it("should allow a farmer to update their own product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-201",
        sellerId: mockFarmerId1,
        status: "DRAFT",
        title: "Original Title",
      } as any);

      vi.mocked(prisma.product.update).mockResolvedValue({
        id: "prod-201",
        sellerId: mockFarmerId1,
        title: "Updated Title",
        status: "DRAFT",
      } as any);

      const updated = await ProductService.updateProduct(
        mockFarmerId1,
        "prod-201",
        { title: "Updated Title" }
      );

      expect(updated.title).toBe("Updated Title");
    });

    it("should prevent Farmer A from updating Farmer B's product (IDOR Prevention)", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-202",
        sellerId: mockFarmerId2, // Owned by Farmer 2
        status: "ACTIVE",
        title: "Farmer 2 Harvest",
      } as any);

      await expect(
        ProductService.updateProduct(mockFarmerId1, "prod-202", {
          title: "Hacked Title",
        })
      ).rejects.toThrow(AppError);
    });

    it("should prevent Farmer A from archiving Farmer B's product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-203",
        sellerId: mockFarmerId2,
        status: "ACTIVE",
      } as any);

      await expect(
        ProductService.archiveProduct(mockFarmerId1, "prod-203")
      ).rejects.toThrow(AppError);
    });

    it("should prevent Farmer A from pausing Farmer B's product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-204",
        sellerId: mockFarmerId2,
        status: "ACTIVE",
      } as any);

      await expect(
        ProductService.pauseProduct(mockFarmerId1, "prod-204")
      ).rejects.toThrow(AppError);
    });
  });

  describe("3. Product Lifecycle & Status Transition Rules", () => {
    it("should allow submitting a DRAFT for moderation", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-301",
        sellerId: mockFarmerId1,
        status: "DRAFT",
      } as any);

      vi.mocked(prisma.product.update).mockResolvedValue({
        id: "prod-301",
        status: "PENDING_MODERATION",
      } as any);

      const res = await ProductService.submitForModeration(
        mockFarmerId1,
        "prod-301"
      );
      expect(res.status).toBe("PENDING_MODERATION");
    });

    it("should reject moderation submission if product is already ACTIVE", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-302",
        sellerId: mockFarmerId1,
        status: "ACTIVE",
      } as any);

      await expect(
        ProductService.submitForModeration(mockFarmerId1, "prod-302")
      ).rejects.toThrow(AppError);
    });

    it("should automatically set status to OUT_OF_STOCK when inventory reaches zero", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "prod-303",
        sellerId: mockFarmerId1,
        status: "ACTIVE",
        availableStock: new Prisma.Decimal(50),
      } as any);

      vi.mocked(prisma.product.update).mockResolvedValue({
        id: "prod-303",
        status: "OUT_OF_STOCK",
        availableStock: new Prisma.Decimal(0),
      } as any);

      const res = await ProductService.updateInventory(
        mockFarmerId1,
        "prod-303",
        0
      );
      expect(res.status).toBe("OUT_OF_STOCK");
    });
  });

  describe("4. Farm Land & Pond Management", () => {
    it("should create a farm and associated address under the farmer profile", async () => {
      vi.mocked(prisma.farmerProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: mockFarmerId1,
      } as any);

      vi.mocked(prisma.address.create).mockResolvedValue({
        id: "addr-1",
        villageOrStreet: "Galsi North",
      } as any);

      vi.mocked(prisma.farm.create).mockResolvedValue({
        id: "farm-1",
        farmerProfileId: "profile-1",
        name: "North Paddy Farm",
        totalAreaAcres: new Prisma.Decimal(8.5),
      } as any);

      const farm = await FarmService.createFarm(mockFarmerId1, {
        name: "North Paddy Farm",
        sector: "AGRICULTURE",
        totalAreaAcres: 8.5,
        villageOrStreet: "Galsi North",
        cityOrTown: "Bardhaman",
        district: "Purba Bardhaman",
        state: "West Bengal",
        pincode: "713406",
      });

      expect(farm.id).toBe("farm-1");
    });

    it("should prevent Farmer A from modifying Farmer B's farm", async () => {
      vi.mocked(prisma.farmerProfile.findUnique).mockResolvedValue({
        id: "profile-1",
        userId: mockFarmerId1,
      } as any);

      vi.mocked(prisma.farm.findUnique).mockResolvedValue({
        id: "farm-2",
        farmerProfileId: "profile-2", // Different farmer profile
      } as any);

      await expect(
        FarmService.updateFarm(mockFarmerId1, "farm-2", {
          name: "Hacked Farm Name",
        })
      ).rejects.toThrow(AppError);
    });
  });
});
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketplaceService } from "@/services/marketplace.service";
import { BuyerService } from "@/services/buyer.service";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

// Mock Prisma
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      buyerProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      savedProduct: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      buyerRequirement: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      product: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      conversation: {
        create: vi.fn(),
      },
      conversationParticipant: {
        count: vi.fn(),
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

describe("Phase 6: Buyer Portal & Dual Marketplace Test Suite", () => {
  const mockBuyerId1 = "buyer-uuid-1";
  const mockBuyerId2 = "buyer-uuid-2";
  const mockSellerId = "seller-uuid-1";
  const mockProductId = "prod-uuid-101";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Public Discovery & Visibility Rules", () => {
    it("should query only ACTIVE and OUT_OF_STOCK products for public discovery", async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        {
          id: mockProductId,
          slug: "swarna-paddy-1",
          title: "Swarna Paddy Grain",
          description: "Grade A harvested paddy",
          sector: "AGRICULTURE",
          category: "Cereals & Grains",
          variety: "Swarna",
          pricePerUnit: new Prisma.Decimal(2200),
          unit: "QUINTAL",
          minimumOrderQuantity: new Prisma.Decimal(10),
          availableStock: new Prisma.Decimal(500),
          harvestDate: new Date(),
          locationDistrict: "Purba Bardhaman",
          locationState: "West Bengal",
          status: "ACTIVE",
          createdAt: new Date(),
          images: [{ url: "https://example.com/paddy.jpg", altText: "Paddy" }],
          seller: {
            id: mockSellerId,
            fullName: "Ramesh Farmer",
            farmerProfile: { isVerified: true, experienceYears: 15 },
          },
        } as any,
      ]);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const result = await MarketplaceService.searchProducts({
        sector: "AGRICULTURE",
        page: 1,
        pageSize: 20,
        sortBy: "newest",
        inStockOnly: false,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe("Swarna Paddy Grain");
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
            sector: "AGRICULTURE",
          }),
        })
      );
    });

    it("should reject product details lookup for DRAFT or PENDING_MODERATION products", async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(
        MarketplaceService.getProductDetails("draft-product-slug")
      ).rejects.toThrow(AppError);
    });
  });

  describe("2. Saved Products & Favorites", () => {
    it("should allow a buyer to save a valid product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: mockProductId,
        title: "Live Rohu Fish",
      } as any);

      vi.mocked(prisma.savedProduct.upsert).mockResolvedValue({
        id: "saved-1",
        buyerId: mockBuyerId1,
        productId: mockProductId,
        createdAt: new Date(),
      } as any);

      const saved = await BuyerService.saveProduct(mockBuyerId1, mockProductId);

      expect(saved.id).toBe("saved-1");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "PRODUCT_SAVED",
            actorUserId: mockBuyerId1,
          }),
        })
      );
    });

    it("should allow a buyer to unsave a product", async () => {
      vi.mocked(prisma.savedProduct.deleteMany).mockResolvedValue({ count: 1 });

      const res = await BuyerService.unsaveProduct(mockBuyerId1, mockProductId);

      expect(res.success).toBe(true);
      expect(prisma.savedProduct.deleteMany).toHaveBeenCalledWith({
        where: { buyerId: mockBuyerId1, productId: mockProductId },
      });
    });

    it("should isolate saved products so Buyer A cannot view Buyer B's saved list", async () => {
      vi.mocked(prisma.savedProduct.findMany).mockResolvedValue([]);
      vi.mocked(prisma.savedProduct.count).mockResolvedValue(0);

      await BuyerService.getSavedProducts(mockBuyerId1);

      expect(prisma.savedProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { buyerId: mockBuyerId1 },
        })
      );
    });
  });

  describe("3. Procurement Requirements Board & IDOR Security", () => {
    it("should create a procurement requirement under the authenticated buyer", async () => {
      vi.mocked(prisma.buyerRequirement.create).mockResolvedValue({
        id: "req-101",
        buyerId: mockBuyerId1,
        title: "500 Quintals Paddy Bulk",
        sector: "AGRICULTURE",
        category: "Cereals & Grains",
        quantity: new Prisma.Decimal(500),
        unit: "QUINTAL",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const req = await BuyerService.createRequirement(mockBuyerId1, {
        title: "500 Quintals Paddy Bulk",
        sector: "AGRICULTURE",
        category: "Cereals & Grains",
        description: "Need bulk milling grade Swarna paddy with moisture < 12%.",
        quantity: 500,
        unit: "QUINTAL",
        targetPricePerUnit: 2150,
        locationDistrict: "Bardhaman",
        locationState: "West Bengal",
        deliveryExpectation: "Within 14 Days",
      });

      expect(req.id).toBe("req-101");
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it("should allow a buyer to update their own requirement", async () => {
      vi.mocked(prisma.buyerRequirement.findUnique).mockResolvedValue({
        id: "req-102",
        buyerId: mockBuyerId1,
      } as any);

      vi.mocked(prisma.buyerRequirement.update).mockResolvedValue({
        id: "req-102",
        title: "Updated Volume RFQ",
      } as any);

      const updated = await BuyerService.updateRequirement(
        mockBuyerId1,
        "req-102",
        { title: "Updated Volume RFQ" }
      );

      expect(updated.title).toBe("Updated Volume RFQ");
    });

    it("should prevent Buyer A from modifying Buyer B's requirement (IDOR Prevention)", async () => {
      vi.mocked(prisma.buyerRequirement.findUnique).mockResolvedValue({
        id: "req-103",
        buyerId: mockBuyerId2, // Owned by Buyer 2
      } as any);

      await expect(
        BuyerService.updateRequirement(mockBuyerId1, "req-103", {
          title: "Hacked Requirement",
        })
      ).rejects.toThrow(AppError);
    });

    it("should prevent Buyer A from deleting Buyer B's requirement (IDOR Prevention)", async () => {
      vi.mocked(prisma.buyerRequirement.findUnique).mockResolvedValue({
        id: "req-104",
        buyerId: mockBuyerId2,
      } as any);

      await expect(
        BuyerService.deleteRequirement(mockBuyerId1, "req-104")
      ).rejects.toThrow(AppError);
    });
  });

  describe("4. Product Inquiry & Contextual Conversations", () => {
    it("should initiate a conversation between buyer and producer for a product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: mockProductId,
        sellerId: mockSellerId,
        title: "Fresh Rohu Fingerlings",
        pricePerUnit: new Prisma.Decimal(5),
        unit: "PIECE",
        images: [{ url: "https://example.com/fish.jpg" }],
        seller: { id: mockSellerId, fullName: "Aqua Hatchery Ltd" },
      } as any);

      vi.mocked(prisma.conversation.create).mockResolvedValue({
        id: "conv-101",
      } as any);

      const conv = await BuyerService.createProductInquiry(mockBuyerId1, {
        productId: mockProductId,
        message: "Can you supply 10,000 fingerlings next Monday?",
      });

      expect(conv.id).toBe("conv-101");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "PRODUCT_INQUIRY_CREATED",
          }),
        })
      );
    });

    it("should reject inquiry if seller tries to inquire on their own product", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: mockProductId,
        sellerId: mockSellerId,
        images: [],
        seller: { id: mockSellerId, fullName: "Self Seller" },
      } as any);

      await expect(
        BuyerService.createProductInquiry(mockSellerId, {
          productId: mockProductId,
          message: "Inquiring about my own harvest",
        })
      ).rejects.toThrow(AppError);
    });
  });
});
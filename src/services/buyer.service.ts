import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma, Sector, BuyerType, RequirementStatus } from "@prisma/client";
import type {
  UpdateBuyerProfileInput,
  CreateRequirementInput,
  UpdateRequirementInput,
  CreateProductInquiryInput,
} from "@/lib/validators/buyer.schema";

export class BuyerService {
  /**
   * Helper to verify or create BuyerProfile
   */
  private static async getOrCreateBuyerProfile(userId: string) {
    const profile = await prisma.buyerProfile.findUnique({
      where: { userId },
      include: { address: true },
    });

    if (!profile) {
      return prisma.buyerProfile.create({
        data: { userId },
        include: { address: true },
      });
    }

    return profile;
  }

  /**
   * Get Buyer Dashboard overview metrics & recommended products
   */
  static async getBuyerDashboard(buyerId: string) {
    const [
      savedCount,
      requirementsCount,
      inquiriesCount,
      recentRequirements,
      recommendedProducts,
    ] = await Promise.all([
      prisma.savedProduct.count({ where: { buyerId } }),
      prisma.buyerRequirement.count({
        where: { buyerId, status: "ACTIVE" },
      }),
      prisma.conversationParticipant.count({
        where: { userId: buyerId },
      }),
      prisma.buyerRequirement.findMany({
        where: { buyerId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.product.findMany({
        where: { status: "ACTIVE", availableStock: { gt: 0 } },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          slug: true,
          title: true,
          sector: true,
          category: true,
          variety: true,
          pricePerUnit: true,
          unit: true,
          availableStock: true,
          locationDistrict: true,
          locationState: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
          seller: {
            select: {
              fullName: true,
              farmerProfile: { select: { isVerified: true } },
            },
          },
        },
      }),
    ]);

    return {
      metrics: {
        savedProducts: savedCount,
        activeRequirements: requirementsCount,
        productInquiries: inquiriesCount,
        connectedSuppliers: 0,
      },
      recentRequirements: recentRequirements.map((r) => ({
        id: r.id,
        title: r.title,
        sector: r.sector,
        category: r.category,
        quantity: r.quantity.toNumber(),
        unit: r.unit,
        targetPricePerUnit: r.targetPricePerUnit?.toNumber() ?? null,
        status: r.status,
        createdAt: r.createdAt,
      })),
      recommendedProducts: recommendedProducts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        sector: p.sector,
        category: p.category,
        variety: p.variety,
        pricePerUnit: p.pricePerUnit.toNumber(),
        unit: p.unit,
        availableStock: p.availableStock.toNumber(),
        locationDistrict: p.locationDistrict,
        locationState: p.locationState,
        imageUrl: p.images[0]?.url || "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
        sellerName: p.seller.fullName,
        isSellerVerified: p.seller.farmerProfile?.isVerified ?? false,
      })),
    };
  }

  /**
   * Get Buyer Profile details
   */
  static async getBuyerProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        buyerProfile: {
          include: { address: true },
        },
      },
    });

    if (!user) {
      throw AppError.notFound("Buyer account not found");
    }

    if (!user.buyerProfile) {
      const newProfile = await prisma.buyerProfile.create({
        data: { userId },
        include: { address: true },
      });
      return { ...user, buyerProfile: newProfile };
    }

    return user;
  }

  /**
   * Update Buyer Profile with address synchronization and audit log
   */
  static async updateBuyerProfile(userId: string, input: UpdateBuyerProfileInput) {
    const current = await this.getBuyerProfile(userId);
    const profileId = current.buyerProfile!.id;
    const existingAddressId = current.buyerProfile?.addressId;

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update User basic info
      if (input.fullName || input.phone !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            fullName: input.fullName,
            phone: input.phone || undefined,
          },
        });
      }

      // 2. Handle Address update or create
      let addressId = existingAddressId;
      if (
        input.villageOrStreet ||
        input.cityOrTown ||
        input.district ||
        input.state ||
        input.pincode
      ) {
        if (existingAddressId) {
          await tx.address.update({
            where: { id: existingAddressId },
            data: {
              villageOrStreet: input.villageOrStreet,
              cityOrTown: input.cityOrTown,
              district: input.district,
              state: input.state,
              pincode: input.pincode || undefined,
            },
          });
        } else if (
          input.villageOrStreet &&
          input.cityOrTown &&
          input.district &&
          input.state &&
          input.pincode
        ) {
          const newAddress = await tx.address.create({
            data: {
              userId,
              villageOrStreet: input.villageOrStreet,
              cityOrTown: input.cityOrTown,
              district: input.district,
              state: input.state,
              pincode: input.pincode,
            },
          });
          addressId = newAddress.id;
        }
      }

      // 3. Update BuyerProfile
      const profile = await tx.buyerProfile.update({
        where: { id: profileId },
        data: {
          companyName: input.companyName,
          buyerType: input.buyerType as BuyerType,
          gstNumber: input.gstNumber,
          addressId,
        },
        include: { address: true },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "BUYER_PROFILE_UPDATED",
          resource: "BuyerProfile",
          resourceId: profileId,
          metadata: { changes: input },
        },
      });

      return profile;
    });

    return updated;
  }

  /**
   * List saved products for a buyer
   */
  static async getSavedProducts(buyerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    try {
      const [saved, total] = await Promise.all([
        prisma.savedProduct.findMany({
          where: { buyerId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                sector: true,
                category: true,
                variety: true,
                pricePerUnit: true,
                unit: true,
                minimumOrderQuantity: true,
                availableStock: true,
                locationDistrict: true,
                locationState: true,
                status: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true },
                },
                seller: {
                  select: {
                    id: true,
                    fullName: true,
                    farmerProfile: { select: { isVerified: true } },
                  },
                },
              },
            },
          },
        }),
        prisma.savedProduct.count({ where: { buyerId } }),
      ]);

      const items = saved.map((s) => ({
        savedId: s.id,
        savedAt: s.createdAt,
        product: {
          id: s.product.id,
          slug: s.product.slug,
          title: s.product.title,
          description: s.product.description,
          sector: s.product.sector,
          category: s.product.category,
          variety: s.product.variety,
          pricePerUnit: s.product.pricePerUnit.toNumber(),
          unit: s.product.unit,
          minimumOrderQuantity: s.product.minimumOrderQuantity.toNumber(),
          availableStock: s.product.availableStock.toNumber(),
          locationDistrict: s.product.locationDistrict,
          locationState: s.product.locationState,
          status: s.product.status,
          imageUrl: s.product.images[0]?.url || "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
          sellerName: s.product.seller.fullName,
          isSellerVerified: s.product.seller.farmerProfile?.isVerified ?? false,
        },
      }));

      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } catch {
      return {
        items: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 1,
        },
      };
    }
  }

  /**
   * Save a product to buyer favorites
   */
  static async saveProduct(buyerId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw AppError.notFound("Product not found");
    }

    const saved = await prisma.$transaction(async (tx) => {
      const record = await tx.savedProduct.upsert({
        where: {
          buyerId_productId: { buyerId, productId },
        },
        create: { buyerId, productId },
        update: {},
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "PRODUCT_SAVED",
          resource: "SavedProduct",
          resourceId: record.id,
          metadata: { productId },
        },
      });

      return record;
    });

    return saved;
  }

  /**
   * Remove a product from buyer favorites
   */
  static async unsaveProduct(buyerId: string, productId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.savedProduct.deleteMany({
        where: { buyerId, productId },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "PRODUCT_UNSAVED",
          resource: "SavedProduct",
          metadata: { productId },
        },
      });
    });

    return { success: true };
  }

  /**
   * List procurement requirements owned by buyer
   */
  static async getBuyerRequirements(buyerId: string, status?: string) {
    return prisma.buyerRequirement.findMany({
      where: {
        buyerId,
        status: status ? (status as RequirementStatus) : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single requirement with buyer ownership check (IDOR protection)
   */
  static async getRequirementById(buyerId: string, requirementId: string) {
    const req = await prisma.buyerRequirement.findUnique({
      where: { id: requirementId },
    });

    if (!req) {
      throw AppError.notFound("Requirement not found");
    }

    if (req.buyerId !== buyerId) {
      throw AppError.forbidden("You do not have permission to access this requirement");
    }

    return req;
  }

  /**
   * Create a new procurement requirement
   */
  static async createRequirement(buyerId: string, input: CreateRequirementInput) {
    const requirement = await prisma.$transaction(async (tx) => {
      const record = await tx.buyerRequirement.create({
        data: {
          buyerId,
          title: input.title,
          sector: input.sector as Sector,
          category: input.category,
          description: input.description,
          quantity: new Prisma.Decimal(input.quantity),
          unit: input.unit,
          targetPricePerUnit: input.targetPricePerUnit
            ? new Prisma.Decimal(input.targetPricePerUnit)
            : null,
          locationDistrict: input.locationDistrict,
          locationState: input.locationState,
          deliveryExpectation: input.deliveryExpectation,
          status: "ACTIVE",
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "REQUIREMENT_CREATED",
          resource: "BuyerRequirement",
          resourceId: record.id,
          metadata: { title: record.title, quantity: input.quantity },
        },
      });

      return record;
    });

    return requirement;
  }

  /**
   * Update requirement with ownership check (IDOR protection)
   */
  static async updateRequirement(
    buyerId: string,
    requirementId: string,
    input: UpdateRequirementInput
  ) {
    await this.getRequirementById(buyerId, requirementId);

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.buyerRequirement.update({
        where: { id: requirementId },
        data: {
          title: input.title,
          sector: input.sector ? (input.sector as Sector) : undefined,
          category: input.category,
          description: input.description,
          quantity:
            input.quantity !== undefined
              ? new Prisma.Decimal(input.quantity)
              : undefined,
          unit: input.unit,
          targetPricePerUnit:
            input.targetPricePerUnit !== undefined
              ? input.targetPricePerUnit
                ? new Prisma.Decimal(input.targetPricePerUnit)
                : null
              : undefined,
          locationDistrict: input.locationDistrict,
          locationState: input.locationState,
          deliveryExpectation: input.deliveryExpectation,
          status: input.status ? (input.status as RequirementStatus) : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "REQUIREMENT_UPDATED",
          resource: "BuyerRequirement",
          resourceId: requirementId,
          metadata: { changes: input },
        },
      });

      return record;
    });

    return updated;
  }

  /**
   * Delete / Cancel requirement with ownership check
   */
  static async deleteRequirement(buyerId: string, requirementId: string) {
    await this.getRequirementById(buyerId, requirementId);

    await prisma.$transaction(async (tx) => {
      await tx.buyerRequirement.delete({
        where: { id: requirementId },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "REQUIREMENT_DELETED",
          resource: "BuyerRequirement",
          resourceId: requirementId,
        },
      });
    });

    return { success: true };
  }

  /**
   * Initiate product inquiry / conversation with seller
   */
  static async createProductInquiry(buyerId: string, input: CreateProductInquiryInput) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { id: true, fullName: true } },
      },
    });

    if (!product) {
      throw AppError.notFound("Product not found");
    }

    if (product.sellerId === buyerId) {
      throw AppError.businessRule("You cannot send an inquiry for your own product");
    }

    const conversation = await prisma.$transaction(async (tx) => {
      // Create or find conversation between buyer and seller
      const conv = await tx.conversation.create({
        data: {
          title: `Inquiry: ${product.title}`,
          isGroup: false,
          participants: {
            create: [
              { userId: buyerId },
              { userId: product.sellerId },
            ],
          },
          messages: {
            create: {
              senderId: buyerId,
              contextType: "PRODUCT",
              contextId: product.id,
              contextSnapshot: {
                productId: product.id,
                title: product.title,
                pricePerUnit: product.pricePerUnit.toNumber(),
                unit: product.unit,
                thumbnail: product.images[0]?.url || null,
                sellerName: product.seller.fullName,
              },
              content: input.message,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "PRODUCT_INQUIRY_CREATED",
          resource: "Conversation",
          resourceId: conv.id,
          metadata: { productId: product.id, sellerId: product.sellerId },
        },
      });

      return conv;
    });

    return conversation;
  }
}
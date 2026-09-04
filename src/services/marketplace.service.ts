import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma, ProductStatus, Sector } from "@prisma/client";
import type { MarketplaceSearchInput } from "@/lib/validators/marketplace.schema";
import { FEATURES } from "@/config/features";

export class MarketplaceService {
  /**
   * Public discovery product query with search, faceted filtering, and pagination.
   * Strictly enforces public visibility (ACTIVE or OUT_OF_STOCK only).
   */
  static async searchProducts(filters: MarketplaceSearchInput, currentUserId?: string) {
    const {
      search,
      sector,
      category,
      variety,
      minPrice,
      maxPrice,
      minMoq,
      maxMoq,
      district,
      state,
      inStockOnly,
      page,
      pageSize,
      sortBy,
    } = filters;

    const skip = (page - 1) * pageSize;

    // Public discovery constraint: strictly ACTIVE or OUT_OF_STOCK
    const allowedStatuses: ProductStatus[] = ["ACTIVE", "OUT_OF_STOCK"];

    const where: Prisma.ProductWhereInput = {
      status: { in: allowedStatuses },
      sector: sector !== "ALL" ? (sector as Sector) : undefined,
      category: category ? { contains: category, mode: "insensitive" } : undefined,
      variety: variety ? { contains: variety, mode: "insensitive" } : undefined,
      locationDistrict: district ? { contains: district, mode: "insensitive" } : undefined,
      locationState: state ? { contains: state, mode: "insensitive" } : undefined,
      ...(inStockOnly && {
        availableStock: { gt: 0 },
      }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            pricePerUnit: {
              ...(minPrice !== undefined && { gte: new Prisma.Decimal(minPrice) }),
              ...(maxPrice !== undefined && { lte: new Prisma.Decimal(maxPrice) }),
            },
          }
        : {}),
      ...(minMoq !== undefined || maxMoq !== undefined
        ? {
            minimumOrderQuantity: {
              ...(minMoq !== undefined && { gte: new Prisma.Decimal(minMoq) }),
              ...(maxMoq !== undefined && { lte: new Prisma.Decimal(maxMoq) }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { variety: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { locationDistrict: { contains: search, mode: "insensitive" } },
          { locationState: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      newest: { createdAt: "desc" as const },
      price_asc: { pricePerUnit: "asc" as const },
      price_desc: { pricePerUnit: "desc" as const },
      stock_desc: { availableStock: "desc" as const },
      title: { title: "asc" as const },
      relevance: { createdAt: "desc" as const },
    }[sortBy] || { createdAt: "desc" as const };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
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
          harvestDate: true,
          locationDistrict: true,
          locationState: true,
          status: true,
          createdAt: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, altText: true },
          },
          seller: {
            select: {
              id: true,
              fullName: true,
              farmerProfile: {
                select: {
                  isVerified: true,
                  experienceYears: true,
                },
              },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Check saved status if buyer is logged in and feature is active (Phase 4)
    let savedProductIds = new Set<string>();
    if (currentUserId && FEATURES.SAVED_PRODUCTS) {
      try {
        const saved = await prisma.savedProduct.findMany({
          where: {
            buyerId: currentUserId,
            productId: { in: items.map((i) => i.id) },
          },
          select: { productId: true },
        });
        savedProductIds = new Set(saved.map((s) => s.productId));
      } catch (err) {
        console.warn("[MarketplaceService] Saved products query failed:", err instanceof Error ? err.message : err);
        savedProductIds = new Set<string>();
      }
    }

    const transformedItems = items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      sector: item.sector,
      category: item.category,
      variety: item.variety,
      pricePerUnit: item.pricePerUnit.toNumber(),
      unit: item.unit,
      minimumOrderQuantity: item.minimumOrderQuantity.toNumber(),
      availableStock: item.availableStock.toNumber(),
      harvestDate: item.harvestDate,
      locationDistrict: item.locationDistrict,
      locationState: item.locationState,
      status: item.status,
      imageUrl: item.images[0]?.url || "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
      seller: {
        id: item.seller.id,
        fullName: item.seller.fullName,
        isVerified: item.seller.farmerProfile?.isVerified ?? false,
        experienceYears: item.seller.farmerProfile?.experienceYears ?? null,
      },
      isSaved: savedProductIds.has(item.id),
    }));

    return {
      items: transformedItems,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  /**
   * Get single product details for public buyer discovery.
   * Redacts private information (passwords, audit metadata, KYC docs).
   */
  static async getProductDetails(productIdOrSlug: string, currentUserId?: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      productIdOrSlug
    );

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: isUuid ? productIdOrSlug : undefined }, { slug: productIdOrSlug }],
        status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        seller: {
          select: {
            id: true,
            fullName: true,
            createdAt: true,
            farmerProfile: {
              select: {
                isVerified: true,
                experienceYears: true,
                avatarUrl: true,
                address: {
                  select: {
                    district: true,
                    state: true,
                  },
                },
                farms: {
                  select: {
                    id: true,
                    name: true,
                    totalAreaAcres: true,
                    sector: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw AppError.notFound("Product not found or not available for public discovery");
    }

    // Count other active products by the same seller
    const sellerActiveProductsCount = await prisma.product.count({
      where: {
        sellerId: product.sellerId,
        status: "ACTIVE",
      },
    });

    let isSaved = false;
    if (currentUserId && FEATURES.SAVED_PRODUCTS) {
      try {
        const saved = await prisma.savedProduct.findUnique({
          where: {
            buyerId_productId: {
              buyerId: currentUserId,
              productId: product.id,
            },
          },
        });
        isSaved = !!saved;
      } catch {
        isSaved = false;
      }
    }

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      sector: product.sector,
      category: product.category,
      variety: product.variety,
      pricePerUnit: product.pricePerUnit.toNumber(),
      unit: product.unit,
      minimumOrderQuantity: product.minimumOrderQuantity.toNumber(),
      availableStock: product.availableStock.toNumber(),
      reservedStock: product.reservedStock.toNumber(),
      harvestDate: product.harvestDate,
      locationDistrict: product.locationDistrict,
      locationState: product.locationState,
      status: product.status,
      createdAt: product.createdAt,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary,
      })),
      seller: {
        id: product.seller.id,
        fullName: product.seller.fullName,
        memberSince: product.seller.createdAt,
        isVerified: product.seller.farmerProfile?.isVerified ?? false,
        experienceYears: product.seller.farmerProfile?.experienceYears ?? null,
        avatarUrl: product.seller.farmerProfile?.avatarUrl ?? null,
        district: product.seller.farmerProfile?.address?.district ?? product.locationDistrict,
        state: product.seller.farmerProfile?.address?.state ?? product.locationState,
        activeListingsCount: sellerActiveProductsCount,
        farms: (product.seller.farmerProfile?.farms || []).map((f) => ({
          id: f.id,
          name: f.name,
          totalAreaAcres: f.totalAreaAcres.toNumber(),
          sector: f.sector,
        })),
      },
      isSaved,
    };
  }

  /**
   * Get dynamic facet filters (sectors, categories, states)
   */
  static async getMarketplaceFacets() {
    const [categories, states] = await Promise.all([
      prisma.product.findMany({
        where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } },
        distinct: ["category"],
        select: { category: true, sector: true },
      }),
      prisma.product.findMany({
        where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } },
        distinct: ["locationState"],
        select: { locationState: true },
      }),
    ]);

    return {
      categories: categories.map((c) => ({ category: c.category, sector: c.sector })),
      states: states.map((s) => s.locationState),
    };
  }
}
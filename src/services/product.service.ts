import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma, ProductStatus, Sector } from "@prisma/client";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductFilterInput,
} from "@/lib/validators/product.schema";

export class ProductService {
  /**
   * Helper to generate a slug from product title and a unique identifier
   */
  private static generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    return `${baseSlug}-${uniqueSuffix}`;
  }

  /**
   * Helper to verify product ownership and return product
   */
  private static async verifyOwnership(sellerId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    if (!product) {
      throw AppError.notFound("Product not found");
    }

    if (product.sellerId !== sellerId) {
      throw AppError.forbidden("You do not have permission to access or modify this product");
    }

    return product;
  }

  /**
   * Create a new product for a verified farmer/seller
   */
  static async createProduct(sellerId: string, input: CreateProductInput) {
    // 1. Verify seller is active
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      include: { farmerProfile: true },
    });

    if (!user || user.status === "SUSPENDED") {
      throw AppError.forbidden("Account is suspended or invalid");
    }

    const slug = this.generateSlug(input.title);
    const initialStatus: ProductStatus = input.submitForModeration
      ? "PENDING_MODERATION"
      : "DRAFT";

    // 2. Create product & images in transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          sellerId,
          title: input.title,
          slug,
          description: input.description,
          sector: input.sector as Sector,
          category: input.category,
          variety: input.variety,
          pricePerUnit: new Prisma.Decimal(input.pricePerUnit),
          unit: input.unit,
          minimumOrderQuantity: new Prisma.Decimal(input.minimumOrderQuantity),
          availableStock: new Prisma.Decimal(input.availableStock),
          harvestDate: input.harvestDate ? new Date(input.harvestDate) : null,
          locationDistrict: input.locationDistrict,
          locationState: input.locationState,
          status: initialStatus,
          images: {
            create: input.images.map((img, idx) => ({
              url: img.url,
              altText: img.altText || input.title,
              isPrimary: img.isPrimary ?? idx === 0,
              sortOrder: img.sortOrder ?? idx,
            })),
          },
        },
        include: {
          images: true,
        },
      });

      // 3. Log Audit trail
      await tx.auditLog.create({
        data: {
          actorUserId: sellerId,
          action: "PRODUCT_CREATED",
          resource: "Product",
          resourceId: newProduct.id,
          metadata: {
            title: newProduct.title,
            status: initialStatus,
            price: input.pricePerUnit,
            stock: input.availableStock,
          },
        },
      });

      return newProduct;
    });

    return product;
  }

  /**
   * Update an existing product with ownership verification
   */
  static async updateProduct(
    sellerId: string,
    productId: string,
    input: UpdateProductInput
  ) {
    const existing = await this.verifyOwnership(sellerId, productId);

    // Can only edit DRAFT, PENDING_MODERATION, PAUSED, or ACTIVE products
    if (existing.status === "ARCHIVED") {
      throw AppError.businessRule("Archived products cannot be modified");
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If images are provided, replace them
      if (input.images) {
        await tx.productImage.deleteMany({
          where: { productId },
        });
      }

      const product = await tx.product.update({
        where: { id: productId },
        data: {
          title: input.title,
          description: input.description,
          sector: input.sector ? (input.sector as Sector) : undefined,
          category: input.category,
          variety: input.variety,
          pricePerUnit:
            input.pricePerUnit !== undefined
              ? new Prisma.Decimal(input.pricePerUnit)
              : undefined,
          unit: input.unit,
          minimumOrderQuantity:
            input.minimumOrderQuantity !== undefined
              ? new Prisma.Decimal(input.minimumOrderQuantity)
              : undefined,
          availableStock:
            input.availableStock !== undefined
              ? new Prisma.Decimal(input.availableStock)
              : undefined,
          harvestDate:
            input.harvestDate !== undefined
              ? input.harvestDate
                ? new Date(input.harvestDate)
                : null
              : undefined,
          locationDistrict: input.locationDistrict,
          locationState: input.locationState,
          status: input.submitForModeration
            ? "PENDING_MODERATION"
            : undefined,
          images: input.images
            ? {
                create: input.images.map((img, idx) => ({
                  url: img.url,
                  altText: img.altText || input.title || existing.title,
                  isPrimary: img.isPrimary ?? idx === 0,
                  sortOrder: img.sortOrder ?? idx,
                })),
              }
            : undefined,
        },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: sellerId,
          action: "PRODUCT_UPDATED",
          resource: "Product",
          resourceId: productId,
          metadata: { changes: input },
        },
      });

      return product;
    });

    return updated;
  }

  /**
   * Get single product by ID with ownership verification
   */
  static async getProductById(sellerId: string, productId: string) {
    return this.verifyOwnership(sellerId, productId);
  }

  /**
   * List farmer products with search, filtering, and pagination
   */
  static async getFarmerProducts(sellerId: string, filters: ProductFilterInput) {
    const { search, status, sector, category, page, limit, sortBy } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      sellerId,
      status: status ? (status as ProductStatus) : undefined,
      sector: sector ? (sector as Sector) : undefined,
      category: category ? { contains: category, mode: "insensitive" } : undefined,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { variety: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      newest: { createdAt: "desc" as const },
      price_asc: { pricePerUnit: "asc" as const },
      price_desc: { pricePerUnit: "desc" as const },
      stock_desc: { availableStock: "desc" as const },
      title: { title: "asc" as const },
    }[sortBy] || { createdAt: "desc" as const };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Submit product for moderation (from DRAFT -> PENDING_MODERATION)
   */
  static async submitForModeration(sellerId: string, productId: string) {
    const product = await this.verifyOwnership(sellerId, productId);

    if (product.status !== "DRAFT") {
      throw AppError.businessRule(
        `Only DRAFT products can be submitted for moderation. Current status: ${product.status}`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.product.update({
        where: { id: productId },
        data: { status: "PENDING_MODERATION" },
        include: { images: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: sellerId,
          action: "PRODUCT_SUBMITTED",
          resource: "Product",
          resourceId: productId,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Pause an ACTIVE product
   */
  static async pauseProduct(sellerId: string, productId: string) {
    const product = await this.verifyOwnership(sellerId, productId);

    if (product.status !== "ACTIVE") {
      throw AppError.businessRule(
        `Only ACTIVE products can be paused. Current status: ${product.status}`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.product.update({
        where: { id: productId },
        data: { status: "PAUSED" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: sellerId,
          action: "PRODUCT_PAUSED",
          resource: "Product",
          resourceId: productId,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Resume a PAUSED product
   */
  static async resumeProduct(sellerId: string, productId: string) {
    const product = await this.verifyOwnership(sellerId, productId);

    if (product.status !== "PAUSED") {
      throw AppError.businessRule(
        `Only PAUSED products can be resumed. Current status: ${product.status}`
      );
    }

    const targetStatus: ProductStatus =
      product.availableStock.toNumber() > 0 ? "ACTIVE" : "OUT_OF_STOCK";

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.product.update({
        where: { id: productId },
        data: { status: targetStatus },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: sellerId,
          action: "PRODUCT_RESUMED",
          resource: "Product",
          resourceId: productId,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Archive a product
   */
  static async archiveProduct(sellerId: string, productId: string) {
    await this.verifyOwnership(sellerId, productId);

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.product.update({
        where: { id: productId },
        data: { status: "ARCHIVED" },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: sellerId,
          action: "PRODUCT_ARCHIVED",
          resource: "Product",
          resourceId: productId,
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Update product inventory stock
   */
  static async updateInventory(
    sellerId: string,
    productId: string,
    newStock: number
  ) {
    if (newStock < 0) {
      throw AppError.validation("Stock quantity cannot be negative");
    }

    const product = await this.verifyOwnership(sellerId, productId);

    let status = product.status;
    if (product.status === "ACTIVE" && newStock === 0) {
      status = "OUT_OF_STOCK";
    } else if (product.status === "OUT_OF_STOCK" && newStock > 0) {
      status = "ACTIVE";
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.product.update({
        where: { id: productId },
        data: {
          availableStock: new Prisma.Decimal(newStock),
          status,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: sellerId,
          action: "INVENTORY_UPDATED",
          resource: "Product",
          resourceId: productId,
          metadata: { previousStock: product.availableStock, newStock },
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Get KPI statistics for farmer dashboard
   */
  static async getFarmerProductStats(sellerId: string) {
    const [
      totalProducts,
      activeProducts,
      pendingModeration,
      outOfStock,
      draftProducts,
      pausedProducts,
    ] = await Promise.all([
      prisma.product.count({ where: { sellerId } }),
      prisma.product.count({ where: { sellerId, status: "ACTIVE" } }),
      prisma.product.count({ where: { sellerId, status: "PENDING_MODERATION" } }),
      prisma.product.count({ where: { sellerId, status: "OUT_OF_STOCK" } }),
      prisma.product.count({ where: { sellerId, status: "DRAFT" } }),
      prisma.product.count({ where: { sellerId, status: "PAUSED" } }),
    ]);

    return {
      totalProducts,
      activeProducts,
      pendingModeration,
      outOfStock,
      draftProducts,
      pausedProducts,
    };
  }
}
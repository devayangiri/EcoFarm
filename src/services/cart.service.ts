import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { FEATURES } from "@/config/features";
import type { AddToCartInput } from "@/lib/validators/cart.schema";

export class CartService {
  /**
   * Get or create active cart for a buyer
   */
  static async getOrCreateCart(buyerId: string) {
    if (!FEATURES.CART_AND_CHECKOUT) {
      throw AppError.businessRule("Wholesale Cart and Checkout is a Phase 8 feature and is not yet available.");
    }

    let cart = await prisma.cart.findFirst({
      where: { buyerId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                seller: { select: { id: true, fullName: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { buyerId, status: "ACTIVE" },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                  seller: { select: { id: true, fullName: true } },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  /**
   * Get formatted buyer cart with authoritative pricing and seller grouping
   */
  static async getCart(buyerId: string) {
    const cart = await this.getOrCreateCart(buyerId);

    // Group items by seller
    const sellerGroupsMap = new Map<
      string,
      {
        sellerId: string;
        sellerName: string;
        items: Array<{
          id: string;
          productId: string;
          productTitle: string;
          slug: string;
          sector: string;
          category: string;
          unit: string;
          pricePerUnit: number;
          quantity: number;
          itemSubtotal: number;
          minimumOrderQuantity: number;
          availableStock: number;
          status: string;
          imageUrl?: string;
        }>;
        sellerSubtotal: number;
      }
    >();

    let grandSubtotal = 0;

    for (const item of cart.items) {
      const product = item.product;
      const unitPrice = product.pricePerUnit.toNumber();
      const quantity = item.quantity.toNumber();
      const itemSubtotal = unitPrice * quantity;

      grandSubtotal += itemSubtotal;

      if (!sellerGroupsMap.has(item.sellerId)) {
        sellerGroupsMap.set(item.sellerId, {
          sellerId: item.sellerId,
          sellerName: product.seller.fullName,
          items: [],
          sellerSubtotal: 0,
        });
      }

      const group = sellerGroupsMap.get(item.sellerId)!;
      group.items.push({
        id: item.id,
        productId: product.id,
        productTitle: product.title,
        slug: product.slug,
        sector: product.sector,
        category: product.category,
        unit: product.unit,
        pricePerUnit: unitPrice,
        quantity,
        itemSubtotal,
        minimumOrderQuantity: product.minimumOrderQuantity.toNumber(),
        availableStock: product.availableStock.toNumber(),
        status: product.status,
        imageUrl: product.images[0]?.url,
      });
      group.sellerSubtotal += itemSubtotal;
    }

    const sellerGroups = Array.from(sellerGroupsMap.values());
    const estimatedShipping = sellerGroups.length > 0 ? sellerGroups.length * 250 : 0;
    const platformCommission = Math.round(grandSubtotal * 0.02 * 100) / 100; // 2% marketplace fee
    const grandTotal = grandSubtotal + estimatedShipping;

    return {
      id: cart.id,
      buyerId: cart.buyerId,
      status: cart.status,
      sellerGroups,
      summary: {
        itemCount: cart.items.length,
        totalUniqueSellers: sellerGroups.length,
        subtotal: grandSubtotal,
        estimatedShipping,
        platformCommission,
        grandTotal,
      },
    };
  }

  /**
   * Add item to buyer's cart with server-side stock and MOQ validation
   */
  static async addToCart(buyerId: string, input: AddToCartInput) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: {
        id: true,
        title: true,
        sellerId: true,
        status: true,
        pricePerUnit: true,
        minimumOrderQuantity: true,
        availableStock: true,
      },
    });

    if (!product) {
      throw AppError.notFound("Product not found");
    }

    if (product.status !== "ACTIVE") {
      throw AppError.businessRule(
        `Product "${product.title}" is currently not available for purchase`
      );
    }

    if (product.sellerId === buyerId) {
      throw AppError.businessRule("You cannot buy your own product listing");
    }

    const moq = product.minimumOrderQuantity.toNumber();
    if (input.quantity < moq) {
      throw AppError.businessRule(
        `Minimum order quantity for "${product.title}" is ${moq}`
      );
    }

    const stock = product.availableStock.toNumber();
    if (input.quantity > stock) {
      throw AppError.businessRule(
        `Requested quantity exceeds available stock (${stock})`
      );
    }

    const cart = await this.getOrCreateCart(buyerId);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: input.productId,
          },
        },
        create: {
          cartId: cart.id,
          productId: input.productId,
          sellerId: product.sellerId,
          quantity: new Prisma.Decimal(input.quantity),
        },
        update: {
          quantity: new Prisma.Decimal(input.quantity),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "CART_ITEM_ADDED",
          resource: "CartItem",
          resourceId: item.id,
          metadata: { productId: product.id, quantity: input.quantity },
        },
      });

      return item;
    });

    return result;
  }

  /**
   * Update item quantity in buyer's cart with ownership check
   */
  static async updateCartItem(
    buyerId: string,
    cartItemId: string,
    quantity: number
  ) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!item) {
      throw AppError.notFound("Cart item not found");
    }

    if (item.cart.buyerId !== buyerId) {
      throw AppError.forbidden("You do not have permission to modify this cart item");
    }

    if (quantity <= 0) {
      return this.removeCartItem(buyerId, cartItemId);
    }

    const moq = item.product.minimumOrderQuantity.toNumber();
    if (quantity < moq) {
      throw AppError.businessRule(
        `Minimum order quantity for "${item.product.title}" is ${moq}`
      );
    }

    const stock = item.product.availableStock.toNumber();
    if (quantity > stock) {
      throw AppError.businessRule(
        `Requested quantity exceeds available stock (${stock})`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.cartItem.update({
        where: { id: cartItemId },
        data: { quantity: new Prisma.Decimal(quantity) },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "CART_ITEM_UPDATED",
          resource: "CartItem",
          resourceId: cartItemId,
          metadata: { newQuantity: quantity },
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Remove item from buyer's cart with ownership check
   */
  static async removeCartItem(buyerId: string, cartItemId: string) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item) {
      throw AppError.notFound("Cart item not found");
    }

    if (item.cart.buyerId !== buyerId) {
      throw AppError.forbidden("You do not have permission to delete this cart item");
    }

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.delete({ where: { id: cartItemId } });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "CART_ITEM_REMOVED",
          resource: "CartItem",
          resourceId: cartItemId,
        },
      });
    });

    return { success: true };
  }

  /**
   * Clear all items in active cart
   */
  static async clearCart(buyerId: string) {
    const cart = await prisma.cart.findFirst({
      where: { buyerId, status: "ACTIVE" },
    });

    if (!cart) return { success: true };

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { success: true };
  }
}
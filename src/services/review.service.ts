import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { FEATURES } from "@/config/features";
import { z } from "zod";

export const CreateProductReviewSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().max(1000, "Comment cannot exceed 1000 characters").optional(),
});

export type CreateProductReviewInput = z.infer<typeof CreateProductReviewSchema>;

export class ReviewService {
  /**
   * Check if a buyer is eligible to review a product
   * (Must have purchased the product in an order that has reached DELIVERED or COMPLETED status)
   */
  static async checkReviewEligibility(buyerId: string, productId: string) {
    if (!FEATURES.REVIEWS) {
      return { isEligible: false, hasReviewed: false, reason: "Reviews are not currently enabled" };
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        authorId: buyerId,
        targetType: "PRODUCT",
        targetId: productId,
      },
    });

    if (existingReview) {
      return {
        isEligible: false,
        hasReviewed: true,
        reason: "You have already reviewed this product",
        existingReviewId: existingReview.id,
      };
    }

    const eligibleOrderItem = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          orderGroup: { buyerId },
          status: { in: ["DELIVERED", "COMPLETED"] },
        },
      },
      select: {
        id: true,
        order: {
          select: { id: true, subOrderNumber: true, status: true },
        },
      },
    });

    if (!eligibleOrderItem) {
      return {
        isEligible: false,
        hasReviewed: false,
        reason: "Reviews are only available for verified delivered purchases",
      };
    }

    return {
      isEligible: true,
      hasReviewed: false,
      orderNumber: eligibleOrderItem.order.subOrderNumber,
    };
  }

  /**
   * Create a verified product review
   */
  static async createProductReview(buyerId: string, input: CreateProductReviewInput) {
    if (!FEATURES.REVIEWS) {
      throw AppError.businessRule("Reviews are not currently enabled");
    }

    const validated = CreateProductReviewSchema.parse(input);

    const eligibility = await this.checkReviewEligibility(buyerId, validated.productId);
    if (!eligibility.isEligible) {
      throw AppError.forbidden(eligibility.reason || "You are not eligible to review this product");
    }

    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      select: { id: true, title: true, sellerId: true },
    });

    if (!product) {
      throw AppError.notFound("Product not found");
    }

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          authorId: buyerId,
          targetType: "PRODUCT",
          targetId: validated.productId,
          rating: validated.rating,
          comment: validated.comment?.trim() || null,
          status: "APPROVED",
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "REVIEW_CREATED",
          resource: "Review",
          resourceId: r.id,
          metadata: { productId: validated.productId, rating: validated.rating },
        },
      });

      return r;
    });

    return review;
  }

  /**
   * Get all approved reviews and rating aggregate for a product
   */
  static async getProductReviews(productId: string) {
    if (!FEATURES.REVIEWS) {
      return { reviews: [], totalReviews: 0, averageRating: 0 };
    }

    try {
      const reviews = await prisma.review.findMany({
        where: {
          targetType: "PRODUCT",
          targetId: productId,
          status: "APPROVED",
        },
        include: {
          author: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? Number(
              (
                reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
              ).toFixed(1)
            )
          : 0;

      return {
        reviews: reviews.map((r) => ({
          id: r.id,
          authorName: r.author.fullName,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
        totalReviews,
        averageRating,
      };
    } catch {
      return { reviews: [], totalReviews: 0, averageRating: 0 };
    }
  }
}

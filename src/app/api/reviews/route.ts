import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/rbac";
import { ReviewService, CreateProductReviewSchema } from "@/services/review.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "productId query parameter is required" },
        { status: 400 }
      );
    }

    const data = await ReviewService.getProductReviews(productId);

    // If buyer is logged in, also check review eligibility
    const user = await getCurrentUser();
    let eligibility = { isEligible: false, hasReviewed: false };
    if (user && user.role === "BUYER") {
      eligibility = await ReviewService.checkReviewEligibility(user.userId, productId);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        eligibility,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const validated = CreateProductReviewSchema.parse(body);

    const review = await ReviewService.createProductReview(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: review,
        message: "Your review has been submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

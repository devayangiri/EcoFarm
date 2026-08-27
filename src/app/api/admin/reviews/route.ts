import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, requireAuth } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { ReviewFilterSchema, CreateReviewInputSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission("ADMIN_VIEW_REVIEWS");
    const { searchParams } = new URL(request.url);

    const queryInput = {
      status: searchParams.get("status") || undefined,
      targetType: searchParams.get("targetType") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
    };

    const validated = ReviewFilterSchema.parse(queryInput);
    const result = await AdminService.getReviews(validated);
    return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = CreateReviewInputSchema.parse(body);

    const review = await AdminService.createReview(user.userId, validated);
    return NextResponse.json({
      success: true,
      data: review,
      message: "Review submitted",
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

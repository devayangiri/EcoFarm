import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { ReviewModerationSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission("ADMIN_MODERATE_REVIEWS");
    const body = await request.json();
    const validated = ReviewModerationSchema.parse(body);

    const result = await AdminService.moderateReview(admin.userId, params.id, validated);
    return NextResponse.json({
      success: true,
      data: result,
      message: "Review moderated",
    });
  } catch (error) {
    return handleError(error);
  }
}

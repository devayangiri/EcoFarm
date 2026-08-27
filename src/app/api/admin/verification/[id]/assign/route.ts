import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { AssignVerificationSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission("ADMIN_REVIEW_VERIFICATIONS");
    const body = await request.json();
    const validated = AssignVerificationSchema.parse(body);

    const result = await AdminService.assignVerification(admin.userId, params.id, validated);
    return NextResponse.json({
      success: true,
      data: result,
      message: "Verification reviewer assigned",
    });
  } catch (error) {
    return handleError(error);
  }
}

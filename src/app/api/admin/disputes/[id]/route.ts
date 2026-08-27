import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { DisputeUpdateSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission("ADMIN_MANAGE_DISPUTES");
    const body = await request.json();
    const validated = DisputeUpdateSchema.parse(body);

    const result = await AdminService.updateDispute(admin.userId, params.id, validated);
    return NextResponse.json({
      success: true,
      data: result,
      message: "Dispute updated",
    });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { UpdateUserStatusSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission("ADMIN_SUSPEND_USERS");
    const body = await request.json();
    const validated = UpdateUserStatusSchema.parse(body);

    const result = await AdminService.updateUserStatus(admin.userId, params.id, validated);
    return NextResponse.json({
      success: true,
      data: result,
      message: `User status updated to ${validated.status}`,
    });
  } catch (error) {
    return handleError(error);
  }
}

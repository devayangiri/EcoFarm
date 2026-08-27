import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { UpdateUserRoleSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission("ADMIN_MANAGE_ROLES");
    const body = await request.json();
    const validated = UpdateUserRoleSchema.parse(body);

    const result = await AdminService.updateUserRole(admin.userId, params.id, validated);
    return NextResponse.json({
      success: true,
      data: result,
      message: `User role updated to ${validated.role}`,
    });
  } catch (error) {
    return handleError(error);
  }
}

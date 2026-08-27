import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { AdminSettingUpdateSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission("ADMIN_MANAGE_SETTINGS");
    const data = await AdminService.getAdminSettings();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminPermission("ADMIN_MANAGE_SETTINGS");
    const body = await request.json();
    const validated = AdminSettingUpdateSchema.parse(body);

    const result = await AdminService.updateAdminSetting(admin.userId, validated);
    return NextResponse.json({
      success: true,
      data: result,
      message: "Admin setting updated",
    });
  } catch (error) {
    return handleError(error);
  }
}

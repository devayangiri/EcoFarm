import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminPermission("ADMIN_VIEW_DASHBOARD");
    const data = await AdminService.getDashboardMetrics(admin.userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

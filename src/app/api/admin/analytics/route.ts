import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission("ADMIN_VIEW_ANALYTICS");
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get("timeRange") as any) || "30d";

    const data = await AdminService.getAnalytics(timeRange);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

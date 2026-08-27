import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, requireAuth } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { ReportFilterSchema, CreateReportInputSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission("ADMIN_VIEW_REPORTS");
    const { searchParams } = new URL(request.url);

    const queryInput = {
      status: searchParams.get("status") || undefined,
      targetType: searchParams.get("targetType") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
    };

    const validated = ReportFilterSchema.parse(queryInput);
    const result = await AdminService.getReports(validated);
    return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = CreateReportInputSchema.parse(body);

    const report = await AdminService.createReport(user.userId, validated);
    return NextResponse.json({
      success: true,
      data: report,
      message: "Report submitted to moderation",
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

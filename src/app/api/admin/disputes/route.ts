import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, requireAuth } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { DisputeFilterSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission("ADMIN_VIEW_DISPUTES");
    const { searchParams } = new URL(request.url);

    const queryInput = {
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
    };

    const validated = DisputeFilterSchema.parse(queryInput);
    const result = await AdminService.getDisputes(validated);
    return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    return handleError(error);
  }
}

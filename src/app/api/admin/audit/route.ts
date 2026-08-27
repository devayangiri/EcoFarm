import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { AuditLogFilterSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission("ADMIN_VIEW_AUDIT_LOGS");
    const { searchParams } = new URL(request.url);

    const queryInput = {
      action: searchParams.get("action") || undefined,
      resource: searchParams.get("resource") || undefined,
      actorUserId: searchParams.get("actorUserId") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
    };

    const validated = AuditLogFilterSchema.parse(queryInput);
    const result = await AdminService.getAuditLogs(validated);
    return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { ProductModerationFilterSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminPermission("ADMIN_VIEW_PRODUCTS");
    const { searchParams } = new URL(request.url);

    const queryInput = {
      status: searchParams.get("status") || undefined,
      sector: searchParams.get("sector") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
    };

    const validated = ProductModerationFilterSchema.parse(queryInput);
    const result = await AdminService.getProductsForModeration(validated);
    return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    return handleError(error);
  }
}

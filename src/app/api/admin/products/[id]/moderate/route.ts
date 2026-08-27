import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { ProductModerationActionSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission("ADMIN_MODERATE_PRODUCTS");
    const body = await request.json();
    const validated = ProductModerationActionSchema.parse(body);

    const result = await AdminService.moderateProduct(admin.userId, params.id, validated);
    return NextResponse.json({
      success: true,
      data: result,
      message: `Product ${validated.action.toLowerCase()}d successfully`,
    });
  } catch (error) {
    return handleError(error);
  }
}

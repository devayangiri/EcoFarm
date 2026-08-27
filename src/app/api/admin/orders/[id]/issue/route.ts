import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { OrderIssueActionSchema } from "@/lib/validators/admin.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission("ADMIN_MANAGE_ORDER_ISSUES");
    const body = await request.json();
    const validated = OrderIssueActionSchema.parse(body);

    const result = await AdminService.handleOrderIssue(admin.userId, params.id, validated);
    return NextResponse.json({
      success: true,
      data: result,
      message: "Order action processed",
    });
  } catch (error) {
    return handleError(error);
  }
}

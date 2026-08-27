import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { OrderService } from "@/services/order.service";
import { UpdateOrderStatusSchema } from "@/lib/validators/order.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("FARMER");
    const body = await request.json();
    const validated = UpdateOrderStatusSchema.parse(body);

    const updated = await OrderService.updateSellerOrderStatus(user.userId, params.id, validated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Order status updated to ${validated.status}`,
    });
  } catch (error) {
    return handleError(error);
  }
}
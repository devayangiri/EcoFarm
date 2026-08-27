import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { OrderService } from "@/services/order.service";
import { CancelOrderSchema } from "@/lib/validators/order.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const { reason } = CancelOrderSchema.parse(body);

    const cancelled = await OrderService.cancelOrderByBuyer(user.userId, params.id, reason);

    return NextResponse.json({
      success: true,
      data: cancelled,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { OrderService } from "@/services/order.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("BUYER");
    const group = await OrderService.getBuyerOrderGroupById(user.userId, params.id);

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    return handleError(error);
  }
}
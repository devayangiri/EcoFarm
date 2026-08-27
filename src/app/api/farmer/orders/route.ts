import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { OrderService } from "@/services/order.service";
import { handleError } from "@/lib/errors";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("FARMER");
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") as OrderStatus) || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    const result = await OrderService.getSellerOrders(user.userId, status, page, limit);

    return NextResponse.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
}
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { OrderService } from "@/services/order.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    const result = await OrderService.getBuyerOrderGroups(user.userId, page, limit);

    return NextResponse.json({
      success: true,
      data: result.orderGroups,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
}
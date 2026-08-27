import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await requireRole("BUYER");
    const result = await BuyerService.unsaveProduct(user.userId, params.productId);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Product removed from favorites",
    });
  } catch (error) {
    return handleError(error);
  }
}
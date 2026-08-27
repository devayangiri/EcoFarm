import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { CartService } from "@/services/cart.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const cart = await CartService.getCart(user.userId);

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const result = await CartService.clearCart(user.userId);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
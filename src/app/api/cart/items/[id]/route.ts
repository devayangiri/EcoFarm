import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { CartService } from "@/services/cart.service";
import { UpdateCartItemSchema } from "@/lib/validators/cart.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const { quantity } = UpdateCartItemSchema.parse(body);

    const updated = await CartService.updateCartItem(user.userId, params.id, quantity);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Cart item updated",
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("BUYER");
    const result = await CartService.removeCartItem(user.userId, params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Item removed from cart",
    });
  } catch (error) {
    return handleError(error);
  }
}
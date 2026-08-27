import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { CartService } from "@/services/cart.service";
import { AddToCartSchema } from "@/lib/validators/cart.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const validated = AddToCartSchema.parse(body);

    const item = await CartService.addToCart(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: item,
        message: "Commodity lot added to cart",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
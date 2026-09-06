import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { CheckoutService } from "@/services/checkout.service";
import { handleError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const DirectCheckoutSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const { productId, quantity } = DirectCheckoutSchema.parse(body);

    const session = await CheckoutService.initiateDirectCheckout(
      user.userId,
      productId,
      quantity
    );

    return NextResponse.json({
      success: true,
      data: session,
      message: "Direct checkout session initiated with 15-minute inventory lock",
    });
  } catch (error) {
    return handleError(error);
  }
}

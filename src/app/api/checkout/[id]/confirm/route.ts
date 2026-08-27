import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { CheckoutService } from "@/services/checkout.service";
import { ConfirmCheckoutSchema } from "@/lib/validators/checkout.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const validated = ConfirmCheckoutSchema.parse({
      ...body,
      checkoutSessionId: params.id,
    });

    const orderGroup = await CheckoutService.confirmCheckout(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: orderGroup,
        message: "Order placed successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
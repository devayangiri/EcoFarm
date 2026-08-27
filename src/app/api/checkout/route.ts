import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { CheckoutService } from "@/services/checkout.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const session = await CheckoutService.initiateCheckout(user.userId);

    return NextResponse.json(
      {
        success: true,
        data: session,
        message: "Checkout session initiated with 15-minute stock reservations",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
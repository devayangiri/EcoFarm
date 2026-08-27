import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { CheckoutService } from "@/services/checkout.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("BUYER");
    const session = await CheckoutService.getCheckoutSession(user.userId, params.id);

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    return handleError(error);
  }
}
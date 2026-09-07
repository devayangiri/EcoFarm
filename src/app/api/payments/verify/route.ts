import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { PaymentService } from "@/services/payment.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const VerifyPaymentSchema = z.object({
  checkoutSessionId: z.string().optional(),
  orderGroupId: z.string().uuid("Invalid order group ID"),
  razorpayOrderId: z.string().min(1, "Razorpay Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay Payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay Signature is required"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const validated = VerifyPaymentSchema.parse(body);

    const result = await PaymentService.verifyOnlinePayment(user.userId, validated);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Payment verified and order confirmed successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

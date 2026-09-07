import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { PaymentService } from "@/services/payment.service";
import { ShippingAddressSchema } from "@/lib/validators/checkout.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const CreatePaymentOrderSchema = z.object({
  checkoutSessionId: z.string().uuid("Invalid checkout session ID"),
  shippingAddress: ShippingAddressSchema,
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const validated = CreatePaymentOrderSchema.parse(body);

    const orderData = await PaymentService.createOnlinePaymentOrder(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: orderData,
        message: "Gateway payment order created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

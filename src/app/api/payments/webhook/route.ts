import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await PaymentService.handleWebhook(body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(error);
  }
}
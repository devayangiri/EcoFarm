import { NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = PaymentService.getPaymentConfig();
  return NextResponse.json({
    success: true,
    data: config,
  });
}

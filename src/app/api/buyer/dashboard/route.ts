import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const data = await BuyerService.getBuyerDashboard(user.userId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(error);
  }
}
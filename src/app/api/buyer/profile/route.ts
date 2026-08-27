import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { UpdateBuyerProfileSchema } from "@/lib/validators/buyer.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const profile = await BuyerService.getBuyerProfile(user.userId);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const validated = UpdateBuyerProfileSchema.parse(body);

    const updated = await BuyerService.updateBuyerProfile(user.userId, validated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Buyer profile updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
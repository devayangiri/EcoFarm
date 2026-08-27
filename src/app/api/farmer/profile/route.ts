import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { FarmerProfileService } from "@/services/farmer-profile.service";
import { UpdateFarmerProfileSchema } from "@/lib/validators/farmer-profile.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("FARMER");
    const profile = await FarmerProfileService.getFarmerProfile(user.userId);

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
    const user = await requireRole("FARMER");
    const body = await request.json();

    const parseResult = UpdateFarmerProfileSchema.safeParse(body);
    if (!parseResult.success) {
      throw AppError.validation("Validation failed", parseResult.error.format());
    }

    const updated = await FarmerProfileService.updateFarmerProfile(
      user.userId,
      parseResult.data
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error) {
    return handleError(error);
  }
}

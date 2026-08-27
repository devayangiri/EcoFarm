import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { FarmService } from "@/services/farm.service";
import { CreateFarmSchema } from "@/lib/validators/farm.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("FARMER");
    const farms = await FarmService.getFarmerFarms(user.userId);

    return NextResponse.json({
      success: true,
      data: farms,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("FARMER");
    const body = await request.json();

    const parseResult = CreateFarmSchema.safeParse(body);
    if (!parseResult.success) {
      throw AppError.validation("Validation failed", parseResult.error.format());
    }

    const farm = await FarmService.createFarm(user.userId, parseResult.data);

    return NextResponse.json(
      {
        success: true,
        message: "Farm created successfully",
        data: farm,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { FarmService } from "@/services/farm.service";
import { UpdateFarmSchema } from "@/lib/validators/farm.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("FARMER");
    const farm = await FarmService.getFarmById(user.userId, params.id);

    return NextResponse.json({
      success: true,
      data: farm,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("FARMER");
    const body = await request.json();

    const parseResult = UpdateFarmSchema.safeParse(body);
    if (!parseResult.success) {
      throw AppError.validation("Validation failed", parseResult.error.format());
    }

    const farm = await FarmService.updateFarm(
      user.userId,
      params.id,
      parseResult.data
    );

    return NextResponse.json({
      success: true,
      message: "Farm updated successfully",
      data: farm,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("FARMER");
    const res = await FarmService.deleteFarm(user.userId, params.id);

    return NextResponse.json({
      success: true,
      message: "Farm deleted successfully",
      data: res,
    });
  } catch (error) {
    return handleError(error);
  }
}

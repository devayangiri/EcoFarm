import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { UpdateRequirementSchema } from "@/lib/validators/buyer.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("BUYER");
    const requirement = await BuyerService.getRequirementById(user.userId, params.id);

    return NextResponse.json({
      success: true,
      data: requirement,
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
    const user = await requireRole("BUYER");
    const body = await request.json();
    const validated = UpdateRequirementSchema.parse(body);

    const updated = await BuyerService.updateRequirement(user.userId, params.id, validated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Requirement updated successfully",
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
    const user = await requireRole("BUYER");
    const result = await BuyerService.deleteRequirement(user.userId, params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Requirement removed successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
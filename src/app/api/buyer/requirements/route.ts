import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { CreateRequirementSchema } from "@/lib/validators/buyer.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const requirements = await BuyerService.getBuyerRequirements(user.userId, status);

    return NextResponse.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const validated = CreateRequirementSchema.parse(body);

    const requirement = await BuyerService.createRequirement(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: requirement,
        message: "Procurement requirement posted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
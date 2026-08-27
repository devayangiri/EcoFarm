import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NetworkService } from "@/services/network.service";
import { UpdateNetworkProfileSchema } from "@/lib/validators/network.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const profile = await NetworkService.getOwnNetworkProfile(user.userId);

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
    const user = await requireAuth();
    const body = await request.json();
    const validated = UpdateNetworkProfileSchema.parse(body);

    const updated = await NetworkService.updateOwnNetworkProfile(user.userId, validated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Network profile updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NetworkService } from "@/services/network.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const network = await NetworkService.getMyNetwork(user.userId);

    return NextResponse.json({
      success: true,
      data: network,
    });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NetworkService } from "@/services/network.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const result = await NetworkService.acceptConnectionRequest(user.userId, params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Connection request accepted",
    });
  } catch (error) {
    return handleError(error);
  }
}

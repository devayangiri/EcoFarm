import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NetworkService } from "@/services/network.service";
import { SendConnectionRequestSchema } from "@/lib/validators/network.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const network = await NetworkService.getMyNetwork(user.userId);

    return NextResponse.json({
      success: true,
      data: {
        received: network.receivedRequests,
        sent: network.sentRequests,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = SendConnectionRequestSchema.parse(body);

    const result = await NetworkService.sendConnectionRequest(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: "Connection request sent successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

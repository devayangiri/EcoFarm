import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const result = await AgentService.getVerificationQueue(user.userId, status);

    return NextResponse.json({ success: true, data: result.cases });
  } catch (error) {
    return handleError(error);
  }
}

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

    const dashboard = await AgentService.getAgentDashboard(user.userId);
    return NextResponse.json({ success: true, data: dashboard });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { TransitionLeadStageSchema } from "@/lib/validators/agent.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const body = await request.json();
    const validated = TransitionLeadStageSchema.parse(body);
    const updated = await AgentService.transitionLeadStage(user.userId, params.id, validated);

    return NextResponse.json({ success: true, data: updated, message: "Lead stage updated" });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { UpdateLeadSchema } from "@/lib/validators/agent.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const lead = await AgentService.getLeadById(user.userId, params.id);
    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const body = await request.json();
    const validated = UpdateLeadSchema.parse(body);
    const updated = await AgentService.updateLead(user.userId, params.id, validated);

    return NextResponse.json({ success: true, data: updated, message: "Lead updated" });
  } catch (error) {
    return handleError(error);
  }
}

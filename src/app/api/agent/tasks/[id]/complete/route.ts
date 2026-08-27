import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const updated = await AgentService.completeTask(user.userId, params.id);
    return NextResponse.json({ success: true, data: updated, message: "Task completed" });
  } catch (error) {
    return handleError(error);
  }
}

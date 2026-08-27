import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { CreateAgentNoteSchema } from "@/lib/validators/agent.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const body = await request.json();
    const validated = CreateAgentNoteSchema.parse(body);
    const note = await AgentService.createAgentNote(user.userId, validated);

    return NextResponse.json({ success: true, data: note, message: "Note added" }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

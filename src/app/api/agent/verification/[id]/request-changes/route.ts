import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { ReviewVerificationSchema } from "@/lib/validators/agent.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const body = await request.json();
    const updated = await AgentService.requestVerificationChanges(user.userId, params.id, body.reviewNotes || "Document updates required");

    return NextResponse.json({ success: true, data: updated, message: "Changes requested" });
  } catch (error) {
    return handleError(error);
  }
}

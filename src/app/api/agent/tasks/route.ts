import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/validators/agent.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const { searchParams } = new URL(request.url);
    const view = (searchParams.get("view") as any) || undefined;
    const result = await AgentService.getTasks(user.userId, { view });

    return NextResponse.json({ success: true, data: result.tasks });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const body = await request.json();
    const validated = CreateTaskSchema.parse(body);
    const task = await AgentService.createTask(user.userId, validated);

    return NextResponse.json({ success: true, data: task, message: "Task created" }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

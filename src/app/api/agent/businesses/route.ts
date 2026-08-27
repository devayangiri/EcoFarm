import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AgentSearchFilterSchema } from "@/lib/validators/agent.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "AGENT" && user.role !== "ADMIN") {
      throw AppError.forbidden("Agent authorization required");
    }

    const { searchParams } = new URL(request.url);
    const query = {
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
    };

    const validated = AgentSearchFilterSchema.parse(query);
    const result = await AgentService.getAssignedBusinesses(user.userId, validated);

    return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    return handleError(error);
  }
}

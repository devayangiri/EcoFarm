import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { UpdateServiceExecutionStatusSchema } from "@/lib/validators/service.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = UpdateServiceExecutionStatusSchema.parse(body);

    const updated = await ServiceService.updateServiceExecutionStatus(user.userId, params.id, validated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Service status updated",
    });
  } catch (error) {
    return handleError(error);
  }
}

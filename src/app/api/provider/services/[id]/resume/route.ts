import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const updated = await ServiceService.resumeService(user.userId, params.id);
    return NextResponse.json({ success: true, data: updated, message: "Service resumed" });
  } catch (error) {
    return handleError(error);
  }
}

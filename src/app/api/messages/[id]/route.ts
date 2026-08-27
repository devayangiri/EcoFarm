import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { MessagingService } from "@/services/messaging.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const result = await MessagingService.softDeleteMessage(user.userId, params.id);
    return NextResponse.json({ success: true, data: result, message: "Message deleted" });
  } catch (error) {
    return handleError(error);
  }
}

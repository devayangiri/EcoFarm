import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { MessagingService } from "@/services/messaging.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const conversation = await MessagingService.getConversationById(user.userId, params.id);
    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    return handleError(error);
  }
}

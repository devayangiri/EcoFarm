import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NotificationService } from "@/services/notification.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const notification = await NotificationService.markAsUnread(user.userId, params.id);
    return NextResponse.json({
      success: true,
      data: notification,
      message: "Notification marked as unread",
    });
  } catch (error) {
    return handleError(error);
  }
}

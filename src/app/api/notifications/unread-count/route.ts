import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NotificationService } from "@/services/notification.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const unreadCount = await NotificationService.getUnreadCount(user.userId);
    return NextResponse.json({ success: true, data: { unreadCount } });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NotificationService } from "@/services/notification.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const result = await NotificationService.markAllAsRead(user.userId);
    return NextResponse.json({
      success: true,
      data: result,
      message: `Marked ${result.count} notifications as read`,
    });
  } catch (error) {
    return handleError(error);
  }
}

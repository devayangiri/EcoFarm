import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NotificationService } from "@/services/notification.service";
import { UpdateNotificationPreferenceSchema } from "@/lib/validators/notification.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const preferences = await NotificationService.getPreferences(user.userId);
    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = UpdateNotificationPreferenceSchema.parse(body);

    const updated = await NotificationService.updatePreferences(user.userId, validated);
    return NextResponse.json({
      success: true,
      data: updated,
      message: "Notification preferences updated",
    });
  } catch (error) {
    return handleError(error);
  }
}

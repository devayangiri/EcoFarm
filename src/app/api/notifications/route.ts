import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NotificationService } from "@/services/notification.service";
import { NotificationFilterSchema } from "@/lib/validators/notification.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const queryInput = {
      unreadOnly: searchParams.get("unreadOnly") || undefined,
      type: searchParams.get("type") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
    };

    const validated = NotificationFilterSchema.parse(queryInput);
    const result = await NotificationService.getNotifications(user.userId, validated);

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
}

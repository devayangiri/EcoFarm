import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { NotificationService } from "@/services/notification.service";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationCenterView } from "@/components/notifications/notification-center-view";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/notifications");
  }

  let notificationResult = { items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
  let unreadCount = 0;

  try {
    const [fetchedResult, fetchedCount] = await Promise.all([
      NotificationService.getNotifications(session.userId, { pageSize: 20 }),
      NotificationService.getUnreadCount(session.userId),
    ]);
    notificationResult = fetchedResult as any;
    unreadCount = fetchedCount;
  } catch (err) {
    console.warn("Notifications database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <NotificationCenterView
        initialNotifications={notificationResult.items as any}
        initialUnreadCount={unreadCount}
        currentUserId={session.userId}
      />
    </AppShell>
  );
}
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

  const [notificationResult, unreadCount] = await Promise.all([
    NotificationService.getNotifications(session.userId, { pageSize: 20 }),
    NotificationService.getUnreadCount(session.userId),
  ]);

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
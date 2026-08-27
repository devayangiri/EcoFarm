import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { NotificationService } from "@/services/notification.service";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationPreferencesView } from "@/components/notifications/notification-preferences-view";

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/notifications/settings");
  }

  const preferences = await NotificationService.getPreferences(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <NotificationPreferencesView
        initialPreferences={preferences}
        currentUserId={session.userId}
      />
    </AppShell>
  );
}
import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { MessagingService } from "@/services/messaging.service";
import { AppShell } from "@/components/layout/app-shell";
import { MessagingView } from "@/components/messaging/messaging-view";

export const dynamic = "force-dynamic";

interface MessagesPageProps {
  searchParams?: {
    conversationId?: string;
  };
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/messages");
  }

  const conversations = await MessagingService.getConversations(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-4 max-w-stitch-container mx-auto font-body text-left">
        <MessagingView
          initialConversations={conversations as any}
          initialActiveId={searchParams?.conversationId || null}
          currentUserId={session.userId}
        />
      </div>
    </AppShell>
  );
}
import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { VerificationQueueView } from "@/components/agent/verification-queue-view";

export const dynamic = "force-dynamic";

export default async function AgentVerificationPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?callbackUrl=/agent/verification");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  const { cases } = await AgentService.getVerificationQueue(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <VerificationQueueView cases={cases as any} />
      </div>
    </AppShell>
  );
}

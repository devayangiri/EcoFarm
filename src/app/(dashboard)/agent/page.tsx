import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { AgentDashboardView } from "@/components/agent/agent-dashboard-view";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?callbackUrl=/agent");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  let data = {
    metrics: { assignedFarms: 0, pendingVerifications: 0, activeLeads: 0, totalCommission: 0 },
    assignments: [],
    recentTasks: [],
  };

  try {
    data = await AgentService.getAgentDashboard(session.userId) as any;
  } catch (err) {
    console.warn("Agent dashboard database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <AgentDashboardView data={data as any} />
      </div>
    </AppShell>
  );
}

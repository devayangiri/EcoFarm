import React from "react";
import { requireRole } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { AgentDashboardView } from "@/components/agent/agent-dashboard-view";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const session = await requireRole(["AGENT", "ADMIN"]);

  let data = {
    profile: {
      badgeNumber: `AGT-${session.userId.substring(0, 4).toUpperCase()}`,
      fullName: session.fullName,
      email: session.email,
      assignedRegionState: "West Bengal",
      assignedDistricts: ["East Bardhaman", "Hooghly", "North 24 Parganas"],
    },
    metrics: {
      assignedFarmersCount: 0,
      assignedBuyersCount: 0,
      assignedBusinessesCount: 0,
      openLeadsCount: 0,
      tasksDueCount: 0,
      pendingVerificationsCount: 0,
    },
    recentTasks: [] as any[],
    recentLeads: [] as any[],
    recentVerifications: [] as any[],
  };

  try {
    const fetched = await AgentService.getAgentDashboard(session.userId);
    if (fetched && fetched.profile) {
      data = fetched as any;
    }
  } catch (err) {
    console.warn("Agent dashboard database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <AppShell
      showSidebar
      currentPath="/agent"
      userRole={session.role}
      userName={session.fullName}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <AgentDashboardView data={data as any} />
      </div>
    </AppShell>
  );
}

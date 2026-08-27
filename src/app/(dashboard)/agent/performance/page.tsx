import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { StatCard } from "@/components/cards/stat-card";
import { Users, TrendingUp, CheckCircle, Clock, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentPerformancePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  const stats = await AgentService.getPerformance(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1 border-b border-surface-dim pb-4">
          <h1 className="font-heading text-2xl font-bold text-on-surface">Agent Operational Performance</h1>
          <p className="text-xs text-slate-neutral">Deterministic KPIs based on verified database activity.</p>
        </div>

        <StatGrid columns={3}>
          <StatCard title="Total Assigned Accounts" value={stats.totalAssigned} icon={Users} iconVariant="primary" />
          <StatCard title="Total Leads Created" value={stats.totalLeads} icon={TrendingUp} iconVariant="secondary" />
          <StatCard title="Leads Converted" value={stats.convertedLeads} icon={CheckCircle} iconVariant="success" />
          <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={TrendingUp} iconVariant="warning" />
          <StatCard title="Completed Field Tasks" value={stats.completedTasks} icon={CheckCircle} iconVariant="success" />
          <StatCard title="Verifications Processed" value={stats.processedVerifications} icon={ShieldCheck} iconVariant="primary" />
        </StatGrid>
      </div>
    </AppShell>
  );
}

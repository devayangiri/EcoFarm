import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  const profile = await AgentService.getOrCreateAgentProfile(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-on-surface">Agent Operational Profile</h1>
          <p className="text-xs text-slate-neutral">Authorized territory and credential configuration.</p>
        </div>

        <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-4 max-w-xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <strong className="font-heading font-bold text-base text-on-surface">{session.fullName}</strong>
              <Badge variant="primary" size="sm">Badge #{profile.badgeNumber}</Badge>
            </div>
            <p className="text-xs text-slate-neutral">{session.email}</p>
          </div>

          <div className="pt-3 border-t border-surface-dim space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-surface-dim">
              <span className="text-slate-neutral">Assigned State:</span>
              <strong className="text-on-surface">{profile.assignedRegionState}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-neutral">Operating Districts:</span>
              <strong className="text-on-surface">{profile.assignedDistricts.join(", ")}</strong>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

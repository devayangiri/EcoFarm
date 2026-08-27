import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { LeadPipelineBoard } from "@/components/agent/lead-pipeline-board";

export const dynamic = "force-dynamic";

export default async function AgentLeadsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?callbackUrl=/agent/leads");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  const { items } = await AgentService.getLeads(session.userId, { page: 1, pageSize: 100 });

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <LeadPipelineBoard leads={items as any} />
      </div>
    </AppShell>
  );
}

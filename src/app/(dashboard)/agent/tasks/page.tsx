import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { TaskManagerView } from "@/components/agent/task-manager-view";

export const dynamic = "force-dynamic";

export default async function AgentTasksPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?callbackUrl=/agent/tasks");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  const { tasks } = await AgentService.getTasks(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <TaskManagerView initialTasks={tasks as any} />
      </div>
    </AppShell>
  );
}

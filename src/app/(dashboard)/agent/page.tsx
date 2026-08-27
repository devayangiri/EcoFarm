import React from "react";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const user = await requireRole("AGENT");

  return (
    <AppShell showSidebar userRole="AGENT" userName={user.fullName} currentPath="/agent">
      <div className="p-6 max-w-stitch-container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-on-surface">Agent Operations Hub</h1>
            <p className="text-sm text-slate-neutral font-body mt-0.5">
              Welcome back, {user.fullName} ({user.email})
            </p>
          </div>
          <Badge variant="info">{user.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-brand-secondary" />
              <CardTitle>Agent Overview</CardTitle>
            </div>
            <CardDescription>Authentication & Role Verified (Role: AGENT)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-neutral font-body">
            <p>Your account is registered as a Field Operations Agent.</p>
            <p className="text-xs bg-surface-low p-3 rounded border border-surface-dim font-mono">
              User ID: {user.userId} | Role: {user.role} | Status: {user.status}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

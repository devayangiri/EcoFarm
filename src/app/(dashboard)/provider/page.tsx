import React from "react";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProviderDashboardPage() {
  const user = await requireRole("SERVICE_PROVIDER");

  return (
    <AppShell showSidebar userRole="SERVICE_PROVIDER" userName={user.fullName} currentPath="/provider">
      <div className="p-6 max-w-stitch-container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-on-surface">Service Provider Portal</h1>
            <p className="text-sm text-slate-neutral font-body mt-0.5">
              Welcome back, {user.fullName} ({user.email})
            </p>
          </div>
          <Badge variant="warning">{user.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-brand-primary" />
              <CardTitle>Provider Overview</CardTitle>
            </div>
            <CardDescription>Authentication & Role Verified (Role: SERVICE_PROVIDER)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-neutral font-body">
            <p>Your account is registered as a Service Provider.</p>
            <p className="text-xs bg-surface-low p-3 rounded border border-surface-dim font-mono">
              User ID: {user.userId} | Role: {user.role} | Status: {user.status}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

import React from "react";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");

  return (
    <AppShell showSidebar userRole="ADMIN" userName={user.fullName} currentPath="/admin">
      <div className="p-6 max-w-stitch-container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-on-surface">Admin Control Center</h1>
            <p className="text-sm text-slate-neutral font-body mt-0.5">
              Administrator: {user.fullName} ({user.email})
            </p>
          </div>
          <Badge variant="error">SUPER_ADMIN</Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-status-error" />
              <CardTitle>System Administration</CardTitle>
            </div>
            <CardDescription>Super Administrator Privileges Verified (Role: ADMIN)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-neutral font-body">
            <p>Full platform management, moderation, user oversight, and financial supervision active.</p>
            <p className="text-xs bg-surface-low p-3 rounded border border-surface-dim font-mono">
              User ID: {user.userId} | Role: {user.role} | Status: {user.status}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

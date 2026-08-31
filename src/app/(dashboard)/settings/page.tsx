import React from "react";
import { getCurrentUser } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { User, Bell, Shield, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const role = user?.role || "GUEST";
  const profileHref =
    role === "FARMER"
      ? "/farmer/profile"
      : role === "BUYER"
      ? "/buyer/profile"
      : role === "AGENT"
      ? "/agent/profile"
      : role === "ADMIN"
      ? "/admin/settings"
      : "/login";

  return (
    <AppShell showSidebar={role !== "GUEST"} userRole={role} userName={user?.fullName} currentPath="/settings">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title="Account & System Settings"
          description="Manage personal profile, notifications, security credentials, and organization preferences."
          badge={<Badge variant="primary">{role}</Badge>}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href={profileHref} className="block group">
            <Card className="p-5 border border-surface-dim bg-white hover:border-brand-primary/40 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary group-hover:scale-105 transition-transform">
                  <User className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold text-on-surface">Profile & Organization</CardTitle>
                <p className="text-xs text-slate-neutral">
                  Update legal trade name, operational address, contact phone, and district headquarters.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-brand-primary">
                <span>Manage Profile</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Card>
          </Link>

          <Link href="/notifications/settings" className="block group">
            <Card className="p-5 border border-surface-dim bg-white hover:border-brand-primary/40 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-secondary/10 text-brand-secondary group-hover:scale-105 transition-transform">
                  <Bell className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold text-on-surface">Notification Preferences</CardTitle>
                <p className="text-xs text-slate-neutral">
                  Configure real-time alerts for marketplace inquiries, order dispatches, and quote updates.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-brand-secondary">
                <span>Configure Alerts</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Card>
          </Link>

          <Link href="/messages" className="block group">
            <Card className="p-5 border border-surface-dim bg-white hover:border-brand-primary/40 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-status-success/10 text-status-success group-hover:scale-105 transition-transform">
                  <Shield className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-bold text-on-surface">Trust & Security</CardTitle>
                <p className="text-xs text-slate-neutral">
                  View session credentials, verified KYB badge status, and role access permissions.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-status-success">
                <span>Security Overview</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

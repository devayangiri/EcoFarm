import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { StatCard } from "@/components/cards/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  ShoppingBag,
  Building2,
  TrendingUp,
  Clock,
  ShieldAlert,
  CheckCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Phone,
} from "lucide-react";

export interface AgentDashboardViewProps {
  data: {
    profile: {
      badgeNumber: string;
      fullName: string;
      email: string;
      assignedRegionState: string;
      assignedDistricts: string[];
    };
    metrics: {
      assignedFarmersCount: number;
      assignedBuyersCount: number;
      assignedBusinessesCount: number;
      openLeadsCount: number;
      tasksDueCount: number;
      pendingVerificationsCount: number;
    };
    recentTasks: Array<{
      id: string;
      title: string;
      dueDate: string;
      priority: string;
      status: string;
    }>;
    recentLeads: Array<{
      id: string;
      contactName: string;
      stage: string;
      targetSector: string;
      estimatedValue: number | null;
    }>;
    recentVerifications: Array<{
      id: string;
      applicantName: string;
      applicantRole: string;
      type: string;
      status: string;
      submittedAt: string;
      docCount: number;
    }>;
  };
}

export function AgentDashboardView({ data }: AgentDashboardViewProps) {
  const profile = data?.profile || {
    badgeNumber: "AGT-ACTIVE",
    fullName: "Field Agent",
    email: "",
    assignedRegionState: "West Bengal",
    assignedDistricts: ["East Bardhaman", "Hooghly", "North 24 Parganas"],
  };

  const metrics = data?.metrics || {
    assignedFarmersCount: 0,
    assignedBuyersCount: 0,
    assignedBusinessesCount: 0,
    openLeadsCount: 0,
    tasksDueCount: 0,
    pendingVerificationsCount: 0,
  };

  const recentTasks = data?.recentTasks || [];
  const recentLeads = data?.recentLeads || [];
  const recentVerifications = data?.recentVerifications || [];

  const districts = Array.isArray(profile?.assignedDistricts) && profile.assignedDistricts.length > 0
    ? profile.assignedDistricts.join(", ")
    : "East Bardhaman, Hooghly, North 24 Parganas";

  return (
    <div className="space-y-6 font-body text-left">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-on-surface">
              Agent Operations Hub
            </h1>
            <Badge variant="primary" size="sm">
              Badge: {profile.badgeNumber || "AGT-ACTIVE"}
            </Badge>
          </div>
          <p className="text-xs text-slate-neutral mt-0.5">
            Operating Territory: <strong className="text-on-surface">{profile.assignedRegionState || "West Bengal"}</strong> ({districts})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/agent/leads">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add Lead
            </Button>
          </Link>
          <Link href="/agent/tasks">
            <Button variant="outline" size="sm" leftIcon={<Calendar className="h-4 w-4" />}>
              Add Task
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <StatGrid columns={3}>
        <StatCard
          title="Assigned Farmers"
          value={metrics.assignedFarmersCount ?? 0}
          icon={Users}
          iconVariant="primary"
        />
        <StatCard
          title="Assigned Buyers"
          value={metrics.assignedBuyersCount ?? 0}
          icon={ShoppingBag}
          iconVariant="secondary"
        />
        <StatCard
          title="Assigned Businesses"
          value={metrics.assignedBusinessesCount ?? 0}
          icon={Building2}
          iconVariant="info"
        />
        <StatCard
          title="Open CRM Leads"
          value={metrics.openLeadsCount ?? 0}
          icon={TrendingUp}
          iconVariant="warning"
        />
        <StatCard
          title="Tasks Due Today"
          value={metrics.tasksDueCount ?? 0}
          icon={Clock}
          iconVariant="warning"
        />
        <StatCard
          title="Verification Queue"
          value={metrics.pendingVerificationsCount ?? 0}
          icon={ShieldAlert}
          iconVariant="primary"
        />
      </StatGrid>

      {/* Main Two-Column Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tasks & Verification Queue */}
        <div className="lg:col-span-7 space-y-6">
          {/* Priority Tasks */}
          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-dim pb-3">
              <h2 className="font-heading text-base font-bold text-on-surface">Urgent Field Tasks</h2>
              <Link href="/agent/tasks" className="text-xs font-semibold text-brand-primary hover:underline">
                View All Tasks
              </Link>
            </div>

            {recentTasks.length === 0 ? (
              <p className="text-xs text-slate-neutral py-2">No pending tasks. You are all caught up!</p>
            ) : (
              <div className="space-y-2.5">
                {recentTasks.map((t) => (
                  <div
                    key={t?.id || Math.random()}
                    className="p-3 bg-surface-low rounded border border-surface-dim flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <strong className="font-semibold text-on-surface block truncate">{t?.title || "Field Task"}</strong>
                      <span className="text-[11px] text-slate-neutral flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {t?.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN") : "Upcoming"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={t?.priority === "URGENT" || t?.priority === "HIGH" ? "error" : "secondary"}
                        size="sm"
                      >
                        {t?.priority || "NORMAL"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Verification Review Queue */}
          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-dim pb-3">
              <h2 className="font-heading text-base font-bold text-on-surface">Pending Verifications</h2>
              <Link href="/agent/verification" className="text-xs font-semibold text-brand-primary hover:underline">
                Open Queue
              </Link>
            </div>

            {recentVerifications.length === 0 ? (
              <p className="text-xs text-slate-neutral py-2">No verification applications awaiting review.</p>
            ) : (
              <div className="space-y-2.5">
                {recentVerifications.map((v) => (
                  <div
                    key={v?.id || Math.random()}
                    className="p-3 bg-surface-low rounded border border-surface-dim flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <strong className="font-semibold text-on-surface block truncate">{v?.applicantName || "Applicant"}</strong>
                      <span className="text-[11px] text-slate-neutral">
                        {v?.applicantRole || "USER"} • {v?.type ? String(v.type).replace(/_/g, " ") : "Identity Verification"} • {v?.docCount ?? 0} doc(s)
                      </span>
                    </div>

                    <Link href={`/agent/verification/${v?.id || ""}`}>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Lead Pipeline & Quick Links */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent CRM Leads */}
          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-dim pb-3">
              <h2 className="font-heading text-base font-bold text-on-surface">Lead Pipeline Snapshot</h2>
              <Link href="/agent/leads" className="text-xs font-semibold text-brand-primary hover:underline">
                CRM Board
              </Link>
            </div>

            {recentLeads.length === 0 ? (
              <p className="text-xs text-slate-neutral py-2">No active leads recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {recentLeads.map((l) => (
                  <div
                    key={l?.id || Math.random()}
                    className="p-3 bg-surface-low rounded border border-surface-dim flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <strong className="font-semibold text-on-surface block truncate">{l?.contactName || "Lead Contact"}</strong>
                      <span className="text-[11px] text-slate-neutral">
                        {l?.targetSector || "AGRICULTURE"} • {typeof l?.estimatedValue === "number" && !isNaN(l.estimatedValue) ? formatCurrency(l.estimatedValue) : "Unestimated"}
                      </span>
                    </div>

                    <Badge variant={l?.stage === "CONVERTED" ? "success" : "primary"} size="sm">
                      {l?.stage || "NEW"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Operational Directory Shortcuts */}
          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-3">
            <h3 className="font-heading text-sm font-bold text-on-surface border-b border-surface-dim pb-2">
              Assigned Account Directories
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/agent/farmers" className="p-2.5 rounded bg-surface-low hover:bg-surface-dim transition-colors flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">Assigned Producers (Farmers)</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-neutral" />
              </Link>
              <Link href="/agent/buyers" className="p-2.5 rounded bg-surface-low hover:bg-surface-dim transition-colors flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">Assigned Buyers & Processors</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-neutral" />
              </Link>
              <Link href="/agent/businesses" className="p-2.5 rounded bg-surface-low hover:bg-surface-dim transition-colors flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">Assigned Commercial Agribusinesses</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-neutral" />
              </Link>
              <Link href="/agent/performance" className="p-2.5 rounded bg-surface-low hover:bg-surface-dim transition-colors flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">Operational Performance & KPI</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-neutral" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
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
              Badge: {data.profile.badgeNumber}
            </Badge>
          </div>
          <p className="text-xs text-slate-neutral mt-0.5">
            Operating Territory: <strong className="text-on-surface">{data.profile.assignedRegionState}</strong> ({data.profile.assignedDistricts.join(", ")})
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
          value={data.metrics.assignedFarmersCount}
          icon={Users}
          iconVariant="primary"
        />
        <StatCard
          title="Assigned Buyers"
          value={data.metrics.assignedBuyersCount}
          icon={ShoppingBag}
          iconVariant="secondary"
        />
        <StatCard
          title="Assigned Businesses"
          value={data.metrics.assignedBusinessesCount}
          icon={Building2}
          iconVariant="info"
        />
        <StatCard
          title="Open CRM Leads"
          value={data.metrics.openLeadsCount}
          icon={TrendingUp}
          iconVariant="warning"
        />
        <StatCard
          title="Tasks Due Today"
          value={data.metrics.tasksDueCount}
          icon={Clock}
          iconVariant="warning"
        />
        <StatCard
          title="Verification Queue"
          value={data.metrics.pendingVerificationsCount}
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

            {data.recentTasks.length === 0 ? (
              <p className="text-xs text-slate-neutral py-2">No pending tasks. You are all caught up!</p>
            ) : (
              <div className="space-y-2.5">
                {data.recentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-surface-low rounded border border-surface-dim flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <strong className="font-semibold text-on-surface block truncate">{t.title}</strong>
                      <span className="text-[11px] text-slate-neutral flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={t.priority === "URGENT" || t.priority === "HIGH" ? "error" : "secondary"}
                        size="sm"
                      >
                        {t.priority}
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

            {data.recentVerifications.length === 0 ? (
              <p className="text-xs text-slate-neutral py-2">No verification applications awaiting review.</p>
            ) : (
              <div className="space-y-2.5">
                {data.recentVerifications.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-surface-low rounded border border-surface-dim flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <strong className="font-semibold text-on-surface block truncate">{v.applicantName}</strong>
                      <span className="text-[11px] text-slate-neutral">
                        {v.applicantRole} • {v.type.replace(/_/g, " ")} • {v.docCount} doc(s)
                      </span>
                    </div>

                    <Link href={`/agent/verification/${v.id}`}>
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

            {data.recentLeads.length === 0 ? (
              <p className="text-xs text-slate-neutral py-2">No active leads recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {data.recentLeads.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 bg-surface-low rounded border border-surface-dim flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <strong className="font-semibold text-on-surface block truncate">{l.contactName}</strong>
                      <span className="text-[11px] text-slate-neutral">
                        {l.targetSector} • {l.estimatedValue ? formatCurrency(l.estimatedValue) : "Unestimated"}
                      </span>
                    </div>

                    <Badge variant={l.stage === "CONVERTED" ? "success" : "primary"} size="sm">
                      {l.stage}
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

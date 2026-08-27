"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import {
  Users,
  ShoppingBag,
  ShieldCheck,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  activeUserRate: number;
  pendingVerifications: number;
  pendingProducts: number;
  activeOrders: number;
  completedOrders: number;
  openDisputes: number;
  openReports: number;
  gmv: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

export interface AdminDashboardViewProps {
  metrics: DashboardMetrics;
  recentActivity: ActivityItem[];
}

export function AdminDashboardView({ metrics, recentActivity }: AdminDashboardViewProps) {
  return (
    <div className="space-y-6 font-body text-left">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
          Admin Control Center
        </h1>
        <p className="text-xs text-slate-neutral">
          Platform governance, user administration, moderation queues, and operational health.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-[11px] text-slate-neutral flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-brand-primary" />
            Total Users
          </span>
          <strong className="font-heading font-bold text-lg text-on-surface block">
            {metrics.totalUsers}
          </strong>
          <span className="text-[10px] text-status-success">{metrics.activeUsers} active ({metrics.activeUserRate}%)</span>
        </Card>

        <Card className="p-3 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-[11px] text-slate-neutral flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-status-success" />
            GMV
          </span>
          <strong className="font-heading font-bold text-lg text-on-surface block truncate">
            {formatCurrency(metrics.gmv)}
          </strong>
          <span className="text-[10px] text-slate-neutral">{metrics.completedOrders} orders</span>
        </Card>

        <Card className="p-3 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-[11px] text-slate-neutral flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5 text-status-warning" />
            Pending Products
          </span>
          <strong className="font-heading font-bold text-lg text-on-surface block">
            {metrics.pendingProducts}
          </strong>
          <Link href="/admin/products" className="text-[10px] text-brand-primary hover:underline">
            Review Queue →
          </Link>
        </Card>

        <Card className="p-3 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-[11px] text-slate-neutral flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-aqua" />
            Verifications
          </span>
          <strong className="font-heading font-bold text-lg text-on-surface block">
            {metrics.pendingVerifications}
          </strong>
          <Link href="/admin/verification" className="text-[10px] text-brand-primary hover:underline">
            Oversight →
          </Link>
        </Card>

        <Card className="p-3 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-[11px] text-slate-neutral flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-brand-primary" />
            Active Orders
          </span>
          <strong className="font-heading font-bold text-lg text-on-surface block">
            {metrics.activeOrders}
          </strong>
          <Link href="/admin/orders" className="text-[10px] text-brand-primary hover:underline">
            Supervise →
          </Link>
        </Card>

        <Card className="p-3 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-[11px] text-slate-neutral flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-status-error" />
            Disputes & Reports
          </span>
          <strong className="font-heading font-bold text-lg text-status-error block">
            {metrics.openDisputes + metrics.openReports}
          </strong>
          <Link href="/admin/disputes" className="text-[10px] text-status-error hover:underline">
            Resolve →
          </Link>
        </Card>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-surface-low border border-surface-dim space-y-2">
          <div className="flex items-center justify-between">
            <strong className="font-heading font-bold text-sm text-on-surface">
              Catalog Moderation
            </strong>
            <Badge variant="warning" size="sm">{metrics.pendingProducts} Pending</Badge>
          </div>
          <p className="text-xs text-slate-neutral">
            Review submitted marketplace products for compliance, safety, and pricing.
          </p>
          <Link href="/admin/products">
            <Button variant="outline" size="sm" className="text-xs gap-1 w-full mt-2">
              <span>Open Product Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="p-4 bg-surface-low border border-surface-dim space-y-2">
          <div className="flex items-center justify-between">
            <strong className="font-heading font-bold text-sm text-on-surface">
              Verification Oversight
            </strong>
            <Badge variant="primary" size="sm">{metrics.pendingVerifications} In Queue</Badge>
          </div>
          <p className="text-xs text-slate-neutral">
            Global governance of farmer KYC, land records, and business credential reviews.
          </p>
          <Link href="/admin/verification">
            <Button variant="outline" size="sm" className="text-xs gap-1 w-full mt-2">
              <span>Inspect Verifications</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>

        <Card className="p-4 bg-surface-low border border-surface-dim space-y-2">
          <div className="flex items-center justify-between">
            <strong className="font-heading font-bold text-sm text-on-surface">
              User Administration
            </strong>
            <Badge variant="secondary" size="sm">{metrics.totalUsers} Registered</Badge>
          </div>
          <p className="text-xs text-slate-neutral">
            Manage user accounts, roles, security status, and token invalidation.
          </p>
          <Link href="/admin/users">
            <Button variant="outline" size="sm" className="text-xs gap-1 w-full mt-2">
              <span>Manage Users</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Platform Audit Activity */}
      <Card className="p-4 bg-white border border-surface-dim shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-surface-dim pb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand-primary" />
            <strong className="font-heading font-bold text-sm text-on-surface">
              Recent Governance & Audit Events
            </strong>
          </div>
          <Link href="/admin/audit" className="text-xs text-brand-primary font-semibold hover:underline">
            View All Audit Logs →
          </Link>
        </div>

        <div className="divide-y divide-surface-dim">
          {recentActivity.map((act) => (
            <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" size="sm">{act.action}</Badge>
                  <span className="font-medium text-on-surface truncate">{act.resource} #{act.resourceId?.slice(0, 8) || ""}</span>
                </div>
                <span className="text-[11px] text-slate-neutral">
                  Actor: <strong>{act.actorName}</strong> ({act.actorRole})
                </span>
              </div>
              <span className="text-[11px] text-slate-neutral shrink-0">
                {formatRelativeTime(new Date(act.createdAt))}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, Package, ShieldCheck } from "lucide-react";

export interface AnalyticsData {
  timeRange: string;
  summary: {
    newRegistrations: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    completedOrderRate: number; // (Completed / Total) * 100
    gmv: number; // Sum of sellerTotal
    averageOrderValue: number; // GMV / Completed Orders
    productsCreated: number;
    verificationRate: number; // (Approved / Total) * 100
  };
  roleDistribution: { role: string; count: number }[];
}

export function PlatformAnalyticsView({ initialData }: { initialData: AnalyticsData }) {
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [timeRange, setTimeRange] = useState<string>(initialData.timeRange);
  const [isLoading, setIsLoading] = useState(false);

  const handleRangeChange = async (range: string) => {
    setTimeRange(range);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?timeRange=${range}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
        <div className="space-y-1">
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
            Platform Analytics & KPI Intelligence
          </h1>
          <p className="text-xs text-slate-neutral">
            Deterministic server-side metrics derived directly from PostgreSQL transactions.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1.5 bg-surface-low p-1 rounded-lg border border-surface-dim">
          {["today", "7d", "30d", "90d", "all"].map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`px-2.5 py-1 rounded text-xs font-semibold uppercase transition-colors ${
                timeRange === r ? "bg-brand-primary text-white" : "text-slate-neutral hover:text-on-surface"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-xs text-slate-neutral flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-status-success" />
            Gross Merchandise Value (GMV)
          </span>
          <strong className="font-heading font-bold text-xl text-on-surface block">
            {formatCurrency(data.summary.gmv)}
          </strong>
          <span className="text-[10px] text-slate-neutral block">
            Formula: Sum(sellerTotal) of eligible orders
          </span>
        </Card>

        <Card className="p-4 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-xs text-slate-neutral flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-brand-primary" />
            Order Completion Rate
          </span>
          <strong className="font-heading font-bold text-xl text-on-surface block">
            {data.summary.completedOrderRate}%
          </strong>
          <span className="text-[10px] text-slate-neutral block">
            Formula: (Completed / Total Orders) * 100
          </span>
        </Card>

        <Card className="p-4 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-xs text-slate-neutral flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-accent-aqua" />
            New Registrations
          </span>
          <strong className="font-heading font-bold text-xl text-on-surface block">
            {data.summary.newRegistrations}
          </strong>
          <span className="text-[10px] text-slate-neutral block">
            Formula: Count(Users created in range)
          </span>
        </Card>

        <Card className="p-4 bg-white border border-surface-dim shadow-xs space-y-1">
          <span className="text-xs text-slate-neutral flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
            Verification Approval Rate
          </span>
          <strong className="font-heading font-bold text-xl text-on-surface block">
            {data.summary.verificationRate}%
          </strong>
          <span className="text-[10px] text-slate-neutral block">
            Formula: (Approved / Total Verifications) * 100
          </span>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card className="p-4 bg-white border border-surface-dim shadow-xs space-y-3">
        <strong className="font-heading font-bold text-sm text-on-surface block border-b border-surface-dim pb-2">
          User Ecosystem Role Distribution
        </strong>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {data.roleDistribution.map((rd) => (
            <div key={rd.role} className="bg-surface-low p-3 rounded-lg text-center">
              <span className="text-[11px] text-slate-neutral block">{rd.role}</span>
              <strong className="font-heading font-bold text-base text-on-surface">{rd.count}</strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

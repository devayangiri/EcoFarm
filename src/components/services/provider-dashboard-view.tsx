"use client";

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
  Wrench,
  Inbox,
  FileText,
  CheckCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";

export interface ProviderDashboardViewProps {
  data: {
    profile: {
      businessName: string;
      description?: string | null;
      isVerified: boolean;
      experienceYears?: number | null;
    };
    metrics: {
      activeServicesCount: number;
      incomingRequestsCount: number;
      pendingQuotationsCount: number;
      completedServicesCount: number;
    };
    recentRequests: Array<{
      id: string;
      requestNumber: string;
      serviceTitle: string;
      category: string;
      requesterName: string;
      requiredDate: string;
      quantityOrScale: string;
      status: string;
      createdAt: string;
    }>;
    activeServices: Array<{
      id: string;
      title: string;
      category: string;
      pricingModel: string;
      basePrice: number;
      status: string;
      isAvailable: boolean;
    }>;
  };
}

export function ProviderDashboardView({ data }: ProviderDashboardViewProps) {
  const profile = data?.profile || {
    businessName: "Service Provider Hub",
    description: "Professional Agricultural & Aquaculture Solutions Provider",
    isVerified: false,
    experienceYears: 0,
  };

  const metrics = data?.metrics || {
    activeServicesCount: 0,
    incomingRequestsCount: 0,
    pendingQuotationsCount: 0,
    completedServicesCount: 0,
  };

  const recentRequests = data?.recentRequests || [];
  const activeServices = data?.activeServices || [];

  return (
    <div className="space-y-6 font-body text-left">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-on-surface">
              {profile.businessName || "Service Provider Hub"}
            </h1>
            {profile.isVerified && (
              <ShieldCheck className="h-5 w-5 text-status-success" />
            )}
          </div>
          <p className="text-xs text-slate-neutral mt-0.5">
            Provider Operations Hub • Manage machinery, logistics, warehousing, and testing contracts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/provider/services/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
              Add Service
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <StatGrid>
        <StatCard
          title="Active Services"
          value={metrics.activeServicesCount ?? 0}
          icon={Wrench}
          iconVariant="primary"
        />
        <StatCard
          title="Incoming Requests"
          value={metrics.incomingRequestsCount ?? 0}
          icon={Inbox}
          iconVariant="secondary"
        />
        <StatCard
          title="Pending Quotations"
          value={metrics.pendingQuotationsCount ?? 0}
          icon={FileText}
          iconVariant="warning"
        />
        <StatCard
          title="Completed Contracts"
          value={metrics.completedServicesCount ?? 0}
          icon={CheckCircle}
          iconVariant="success"
        />
      </StatGrid>

      {/* Recent Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-bold text-on-surface">Recent Service Requests</h2>
          <span className="text-xs text-slate-neutral">Actionable RFQs from producers & buyers</span>
        </div>

        {recentRequests.length === 0 ? (
          <EmptyState
            title="No Incoming Service Requests"
            description="When buyers and farmers request your machinery, storage, or transport services, they will appear here."
          />
        ) : (
          <div className="space-y-3">
            {recentRequests.map((req) => (
              <Card key={req.id} className="border border-surface-dim bg-white shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-brand-primary">{req.requestNumber}</span>
                    <strong className="text-on-surface font-semibold text-sm truncate">{req.serviceTitle}</strong>
                    <Badge variant={req.status === "OPEN" ? "secondary" : "info"} size="sm">{req.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-neutral">
                    Client: <strong className="text-on-surface">{req.requesterName}</strong> • Scale: {req.quantityOrScale} • Required Date: {req.requiredDate ? new Date(req.requiredDate).toLocaleDateString() : "TBD"}
                  </p>
                </div>

                <Link href={`/provider/requests/${req.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <span>Review & Quote</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Active Service Catalog */}
      <div className="space-y-4 pt-4 border-t border-surface-dim">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-bold text-on-surface">My Service Solutions Catalog</h2>
          <Link href="/provider/services" className="text-xs text-brand-primary font-semibold hover:underline">
            Manage All Services
          </Link>
        </div>

        {activeServices.length === 0 ? (
          <EmptyState
            title="No Services Listed Yet"
            description="You have not published any service offerings. List machinery, equipment rental, warehousing, or cold-chain logistics."
            actionLabel="Publish First Service"
            actionHref="/provider/services/new"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServices.map((s) => (
              <Card key={s.id} className="border border-surface-dim bg-white shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm">{s.category.replace(/_/g, " ")}</Badge>
                  <Badge variant={s.status === "ACTIVE" ? "success" : "secondary"} size="sm">{s.status}</Badge>
                </div>
                <strong className="font-heading font-bold text-sm text-on-surface block truncate">{s.title}</strong>
                <span className="font-mono text-brand-primary font-extrabold text-sm block">
                  {formatCurrency(s.basePrice)} <span className="text-xs font-normal text-slate-neutral">({s.pricingModel})</span>
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

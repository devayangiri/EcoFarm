import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Sprout,
  Waves,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface BuyerRequirementsPageProps {
  searchParams: {
    status?: string;
  };
}

export default async function BuyerRequirementsPage({
  searchParams,
}: BuyerRequirementsPageProps) {
  const user = await requireRole("BUYER");
  const requirements = await BuyerService.getBuyerRequirements(
    user.userId,
    searchParams.status
  );

  return (
    <AppShell showSidebar userRole="BUYER" userName={user.fullName} currentPath="/buyer/requirements">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title="Procurement Requirements Board"
          description="Publish bulk volume requests for crops and live aquaculture to receive competitive producer quotes."
          breadcrumbs={[
            { label: "Buyer Portal", href: "/buyer" },
            { label: "Requirements", current: true },
          ]}
        />

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-heading font-semibold">
          {[
            { label: "All Statuses", value: "" },
            { label: "Active", value: "ACTIVE" },
            { label: "Draft", value: "DRAFT" },
            { label: "Closed", value: "CLOSED" },
            { label: "Cancelled", value: "CANCELLED" },
          ].map((st) => (
            <Link
              key={st.label}
              href={`/buyer/requirements${st.value ? `?status=${st.value}` : ""}`}
              className={`px-3 py-1 rounded-full border transition-all ${
                (searchParams.status || "") === st.value
                  ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                  : "bg-white text-slate-neutral border-surface-dim hover:bg-surface-low"
              }`}
            >
              {st.label}
            </Link>
          ))}
        </div>

        {/* Requirements Grid */}
        {requirements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {requirements.map((req) => (
              <Card key={req.id} className="border border-surface-dim bg-white p-5 space-y-4 hover:border-brand-primary/40 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={req.sector === "AGRICULTURE" ? "primary" : "secondary"}>
                      {req.sector === "AGRICULTURE" ? (
                        <>
                          <Sprout className="h-3 w-3" />
                          <span>Agri</span>
                        </>
                      ) : (
                        <>
                          <Waves className="h-3 w-3" />
                          <span>Aqua</span>
                        </>
                      )}
                    </Badge>
                    <Badge variant={req.status === "ACTIVE" ? "success" : "neutral"}>
                      {req.status}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-base text-on-surface line-clamp-2">
                      {req.title}
                    </h3>
                    <p className="text-xs text-slate-neutral mt-0.5">{req.category}</p>
                  </div>

                  <p className="text-xs text-slate-neutral line-clamp-3 leading-relaxed">
                    {req.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-surface-dim text-xs">
                  <div className="flex justify-between py-1 border-b border-surface-dim">
                    <span className="text-slate-neutral">Required Quantity:</span>
                    <span className="font-mono font-bold text-on-surface">
                      {req.quantity.toNumber()} {req.unit}
                    </span>
                  </div>

                  {req.targetPricePerUnit && (
                    <div className="flex justify-between py-1 border-b border-surface-dim">
                      <span className="text-slate-neutral">Target Ceiling:</span>
                      <span className="font-heading font-bold text-brand-primary">
                        {formatCurrency(req.targetPricePerUnit.toNumber())}/{req.unit}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1">
                    <span className="text-slate-neutral">Destination:</span>
                    <span className="font-medium text-on-surface">
                      {req.locationDistrict}, {req.locationState}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Procurement Requirements Found"
            description="Create a bulk procurement request to broadcast your volume demands to verified producers and field agents."
          />
        )}
      </div>
    </AppShell>
  );
}
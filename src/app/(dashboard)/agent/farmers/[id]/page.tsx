import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, MapPin, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

interface FarmerDetailPageProps {
  params: { id: string };
}

export default async function AgentFarmerDetailPage({ params }: FarmerDetailPageProps) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  let farmer;
  try {
    farmer = await AgentService.getAssignedFarmerDetail(session.userId, params.id);
  } catch {
    notFound();
  }

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <Link
          href="/agent/farmers"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-slate-neutral hover:text-brand-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Assigned Farmers</span>
        </Link>

        {/* Farmer Header */}
        <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="font-heading text-2xl font-bold text-on-surface">{farmer.fullName}</h1>
              <p className="text-xs text-slate-neutral">
                Assigned: {new Date(farmer.assignedAt).toLocaleDateString()} • Phone: {farmer.phone || "N/A"}
              </p>
            </div>
            <Badge variant="primary" size="md">{farmer.status}</Badge>
          </div>
        </Card>

        {/* Farms & Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4">
            <h2 className="font-heading text-base font-bold text-on-surface">Registered Farms ({farmer.farms.length})</h2>
            <div className="space-y-3">
              {farmer.farms.map((f) => (
                <div key={f.id} className="p-3 bg-surface-low rounded border border-surface-dim text-xs space-y-1">
                  <strong className="font-semibold text-on-surface block">{f.name}</strong>
                  <span className="text-slate-neutral block">{f.sizeInAcres} Acres • {f.primarySector}</span>
                  <span className="text-[11px] text-slate-neutral flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {f.locationDistrict}, {f.locationState}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4">
            <h2 className="font-heading text-base font-bold text-on-surface">Product Listings ({farmer.products.length})</h2>
            <div className="space-y-3">
              {farmer.products.map((p) => (
                <div key={p.id} className="p-3 bg-surface-low rounded border border-surface-dim text-xs flex items-center justify-between">
                  <div>
                    <strong className="font-semibold text-on-surface block">{p.title}</strong>
                    <span className="text-slate-neutral">{p.availableStock} {p.unit} in stock</span>
                  </div>
                  <span className="font-mono font-bold text-brand-primary">{formatCurrency(p.pricePerUnit)}/{p.unit}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Private Operational Notes */}
        <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-heading text-base font-bold text-on-surface">Agent Operational Notes ({farmer.notes.length})</h2>
          {farmer.notes.length === 0 ? (
            <p className="text-xs text-slate-neutral">No operational notes recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {farmer.notes.map((n) => (
                <div key={n.id} className="p-3 bg-surface-low rounded border border-surface-dim text-xs space-y-1">
                  <p className="text-on-surface leading-relaxed">{n.content}</p>
                  <span className="text-[10px] text-slate-neutral block">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

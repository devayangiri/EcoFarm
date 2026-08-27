import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldCheck, ChevronRight, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentFarmersPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  const { items } = await AgentService.getAssignedFarmers(session.userId, { page: 1, pageSize: 50 });

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1 border-b border-surface-dim pb-4">
          <h1 className="font-heading text-2xl font-bold text-on-surface">Assigned Producers (Farmers)</h1>
          <p className="text-xs text-slate-neutral">
            Producers assigned to your territory for field advisory, harvest verification, and onboarding.
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No Farmers Assigned"
            description="You currently have no active farmer accounts assigned to your operational badge."
          />
        ) : (
          <div className="space-y-3">
            {items.map((f) => (
              <Card key={f.id} className="p-4 bg-white border border-surface-dim shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="font-heading font-bold text-sm text-on-surface truncate">{f.fullName}</strong>
                    {f.isVerified && <ShieldCheck className="h-4 w-4 text-status-success" />}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-neutral">
                    {f.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{f.phone}</span>}
                    <span>Farms: <strong className="text-on-surface">{f.farmCount} ({f.totalAcres} Acres)</strong></span>
                    <span>Active Listings: <strong className="text-on-surface">{f.activeProductsCount}</strong></span>
                  </div>
                </div>

                <Link href={`/agent/farmers/${f.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <span>Manage Farmer</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

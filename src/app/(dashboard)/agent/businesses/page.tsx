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
import { ShieldCheck, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentBusinessesPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  const { items } = await AgentService.getAssignedBusinesses(session.userId, { page: 1, pageSize: 50 });

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1 border-b border-surface-dim pb-4">
          <h1 className="font-heading text-2xl font-bold text-on-surface">Assigned Commercial Agribusinesses</h1>
          <p className="text-xs text-slate-neutral">
            Agri-input dealers, hatcheries, processors, and warehouse partners assigned to your account.
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No Businesses Assigned"
            description="You currently have no commercial agribusinesses assigned."
          />
        ) : (
          <div className="space-y-3">
            {items.map((b) => (
              <Card key={b.id} className="p-4 bg-white border border-surface-dim shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="font-heading font-bold text-sm text-on-surface truncate">{b.displayName}</strong>
                    {b.isVerified && <ShieldCheck className="h-4 w-4 text-status-success" />}
                  </div>
                  <p className="text-xs text-slate-neutral">{b.businessCategory} • {b.district}, {b.state}</p>
                </div>

                <Link href={`/network/${b.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <span>View Profile</span>
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

import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Wrench, ChevronRight, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BuyerServicesPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?callbackUrl=/buyer/services");

  const { requests } = await ServiceService.getBuyerServiceRequests(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-on-surface">My Service Requests & RFQs</h1>
          <p className="text-xs text-slate-neutral">
            Track quotations, accept provider bids, and review execution milestones for machinery, cold storage, and logistics.
          </p>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            title="No Service Requests Submitted"
            description="Explore the agricultural and aquaculture services directory to request machinery, transport, and testing solutions."
            actionLabel="Discover Services"
            actionHref="/services"
          />
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <Card key={r.id} className="border border-surface-dim bg-white shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-brand-primary">{r.requestNumber}</span>
                    <strong className="font-heading font-bold text-sm text-on-surface truncate">{r.serviceTitle}</strong>
                    <Badge variant={r.status === "COMPLETED" ? "success" : "secondary"} size="sm">{r.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-neutral">
                    Provider: <strong className="text-on-surface">{r.providerName}</strong> • Required: {new Date(r.requiredDate).toLocaleDateString()} • Scale: {r.quantityOrScale}
                  </p>
                  <span className="text-[11px] text-brand-secondary font-semibold block">
                    {r.quotationsCount} Quotation(s) Received
                  </span>
                </div>

                <Link href={`/buyer/services/${r.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <span>View Quotations</span>
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

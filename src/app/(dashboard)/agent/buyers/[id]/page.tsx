import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AgentService } from "@/services/agent.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface BuyerDetailPageProps {
  params: { id: string };
}

export default async function AgentBuyerDetailPage({ params }: BuyerDetailPageProps) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "AGENT" && session.role !== "ADMIN") redirect("/");

  let buyer;
  try {
    buyer = await AgentService.getAssignedBuyerDetail(session.userId, params.id);
  } catch {
    notFound();
  }

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <Link
          href="/agent/buyers"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-slate-neutral hover:text-brand-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Assigned Buyers</span>
        </Link>

        <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-3">
          <h1 className="font-heading text-2xl font-bold text-on-surface">{buyer.buyerProfile?.companyName || buyer.fullName}</h1>
          <p className="text-xs text-slate-neutral">Contact: {buyer.fullName} ({buyer.email})</p>
        </Card>

        {/* Requirements */}
        <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-heading text-base font-bold text-on-surface">Active Procurement Requirements ({buyer.requirements.length})</h2>
          {buyer.requirements.length === 0 ? (
            <p className="text-xs text-slate-neutral">No active RFQs posted.</p>
          ) : (
            <div className="space-y-3">
              {buyer.requirements.map((r) => (
                <div key={r.id} className="p-3 bg-surface-low rounded border border-surface-dim text-xs flex items-center justify-between">
                  <div>
                    <strong className="font-semibold text-on-surface block">{r.title}</strong>
                    <span className="text-slate-neutral">{r.quantity} {r.unit} • {r.category} ({r.sector})</span>
                  </div>
                  <Badge variant="primary" size="sm">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

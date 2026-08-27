import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Pause, Play, Trash2, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProviderServicesListPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?callbackUrl=/provider/services");

  const { services } = await ServiceService.getProviderServices(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-on-surface">Manage Service Listings</h1>
            <p className="text-xs text-slate-neutral">
              Publish, edit, pause, and configure machinery, logistics, and laboratory testing offerings.
            </p>
          </div>

          <Link href="/provider/services/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
              Add New Service
            </Button>
          </Link>
        </div>

        {services.length === 0 ? (
          <EmptyState
            title="No Services Listed Yet"
            description="Create your first machinery rental, cold storage, or transport service listing to start receiving quotation requests."
            actionLabel="Add Service"
            actionHref="/provider/services/new"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <Card key={s.id} className="border border-surface-dim bg-white shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary" size="sm">{s.category.replace(/_/g, " ")}</Badge>
                    <Badge variant={s.status === "ACTIVE" ? "success" : "secondary"} size="sm">{s.status}</Badge>
                  </div>
                  <strong className="font-heading font-bold text-base text-on-surface block">{s.title}</strong>
                  <p className="text-xs text-slate-neutral line-clamp-2">{s.description}</p>
                </div>

                <div className="pt-3 border-t border-surface-dim flex items-center justify-between">
                  <span className="font-mono text-base font-extrabold text-brand-primary">
                    {formatCurrency(s.basePrice)} <span className="text-xs font-normal text-slate-neutral">({s.pricingModel})</span>
                  </span>

                  <Link href={`/provider/services/${s.id}/edit`}>
                    <Button variant="outline" size="sm" leftIcon={<Edit className="h-3.5 w-3.5" />}>
                      Edit
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { AppShell } from "@/components/layout/app-shell";
import { ProviderDashboardView } from "@/components/services/provider-dashboard-view";

export const dynamic = "force-dynamic";

export default async function ProviderDashboardPage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/provider");
  }

  let data = {
    metrics: { activeServices: 0, totalRequests: 0, pendingQuotations: 0, acceptedOrders: 0 },
    services: [],
    recentRequests: [],
  };

  try {
    data = await ServiceService.getProviderDashboard(session.userId) as any;
  } catch (err) {
    console.warn("Provider dashboard database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <ProviderDashboardView data={data as any} />
      </div>
    </AppShell>
  );
}

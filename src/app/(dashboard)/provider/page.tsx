import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getRoleDashboardPath } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { AppShell } from "@/components/layout/app-shell";
import { ProviderDashboardView } from "@/components/services/provider-dashboard-view";

export const dynamic = "force-dynamic";

export default async function ProviderDashboardPage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/provider");
  }

  if (session.role !== "SERVICE_PROVIDER" && session.role !== "ADMIN") {
    redirect(getRoleDashboardPath(session.role));
  }

  let data = {
    profile: {
      businessName: `${session.fullName} Solutions`,
      description: "Professional Agricultural & Aquaculture Solutions Provider",
      isVerified: session.status === "ACTIVE",
      experienceYears: 0,
    },
    metrics: {
      activeServicesCount: 0,
      incomingRequestsCount: 0,
      pendingQuotationsCount: 0,
      completedServicesCount: 0,
    },
    recentRequests: [] as any[],
    activeServices: [] as any[],
  };

  try {
    const fetched = await ServiceService.getProviderDashboard(session.userId);
    if (fetched && fetched.profile) {
      data = fetched as any;
    }
  } catch (err) {
    console.warn("Provider dashboard database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <AppShell
      showSidebar
      currentPath="/provider"
      userRole={session.role}
      userName={session.fullName}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <ProviderDashboardView data={data as any} />
      </div>
    </AppShell>
  );
}

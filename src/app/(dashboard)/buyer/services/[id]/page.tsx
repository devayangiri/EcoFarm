import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceRequestView } from "@/components/services/service-request-view";

export const dynamic = "force-dynamic";

interface BuyerServiceRequestDetailPageProps {
  params: { id: string };
}

export default async function BuyerServiceRequestDetailPage({
  params,
}: BuyerServiceRequestDetailPageProps) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  let request;
  try {
    request = await ServiceService.getServiceRequestById(session.userId, params.id);
  } catch {
    notFound();
  }

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <ServiceRequestView request={request as any} />
      </div>
    </AppShell>
  );
}

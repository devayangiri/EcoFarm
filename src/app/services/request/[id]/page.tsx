import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { ServiceRequestForm } from "@/components/services/service-request-form";

export const dynamic = "force-dynamic";

interface ServiceRequestSubmissionPageProps {
  params: { id: string };
}

export default async function ServiceRequestSubmissionPage({
  params,
}: ServiceRequestSubmissionPageProps) {
  const session = await getCurrentUser();
  if (!session) {
    redirect(`/login?callbackUrl=/services/request/${params.id}`);
  }

  let service;
  try {
    service = await ServiceService.getServiceDetails(params.id);
  } catch {
    notFound();
  }

  return (
    <MarketplaceShell>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-on-surface">
            Request Commercial Service Quotation
          </h1>
          <p className="text-xs text-slate-neutral">
            Define your project timeline, acreage or tonnage volume, and exact field location.
          </p>
        </div>

        <ServiceRequestForm service={service as any} />
      </div>
    </MarketplaceShell>
  );
}

import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { AppShell } from "@/components/layout/app-shell";
import { ProviderServiceForm } from "@/components/services/provider-service-form";

export const dynamic = "force-dynamic";

interface EditServicePageProps {
  params: { id: string };
}

export default async function ProviderEditServicePage({ params }: EditServicePageProps) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  let service;
  try {
    service = await ServiceService.getServiceDetails(params.id);
  } catch {
    notFound();
  }

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <ProviderServiceForm initialService={service as any} isEdit={true} />
      </div>
    </AppShell>
  );
}

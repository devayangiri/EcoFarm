import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { ProviderServiceForm } from "@/components/services/provider-service-form";

export const dynamic = "force-dynamic";

export default async function ProviderNewServicePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?callbackUrl=/provider/services/new");

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <ProviderServiceForm />
      </div>
    </AppShell>
  );
}

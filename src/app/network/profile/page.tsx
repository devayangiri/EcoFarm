import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { NetworkService } from "@/services/network.service";
import { AppShell } from "@/components/layout/app-shell";
import { NetworkProfileForm } from "@/components/network/network-profile-form";

export const dynamic = "force-dynamic";

export default async function EditNetworkProfilePage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/network/profile");
  }

  const profile = await NetworkService.getOwnNetworkProfile(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-2xl font-bold text-on-surface">Manage Network Identity</h1>
          <p className="text-xs text-slate-neutral">
            Control how your business entity is discovered by wholesale buyers and agricultural producers.
          </p>
        </div>

        <NetworkProfileForm initialProfile={profile as any} />
      </div>
    </AppShell>
  );
}

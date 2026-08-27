import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { NetworkService } from "@/services/network.service";
import { AppShell } from "@/components/layout/app-shell";
import { MyNetworkView } from "@/components/network/my-network-view";

export const dynamic = "force-dynamic";

export default async function MyNetworkPage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect("/login?callbackUrl=/network/connections");
  }

  const network = await NetworkService.getMyNetwork(session.userId);

  return (
    <AppShell userRole={session.role} userName={session.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-on-surface">My Business Network</h1>
          <p className="text-xs text-slate-neutral">
            Manage your trusted relationships, respond to incoming B2B partnership requests, and view sent requests.
          </p>
        </div>

        <MyNetworkView initialNetwork={network as any} />
      </div>
    </AppShell>
  );
}

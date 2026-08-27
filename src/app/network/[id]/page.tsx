import React from "react";
import { notFound } from "next/navigation";
import { NetworkService } from "@/services/network.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { NetworkProfileView } from "@/components/network/network-profile-view";
import { getCurrentUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

interface NetworkProfilePageProps {
  params: { id: string };
}

export default async function NetworkProfilePage({ params }: NetworkProfilePageProps) {
  const session = await getCurrentUser();

  let profile;
  try {
    profile = await NetworkService.getPublicProfile(params.id, session?.userId);
  } catch {
    notFound();
  }

  return (
    <MarketplaceShell>
      <div className="py-6 max-w-stitch-container mx-auto">
        <NetworkProfileView
          profile={profile as any}
          currentUserRole={session?.role}
        />
      </div>
    </MarketplaceShell>
  );
}

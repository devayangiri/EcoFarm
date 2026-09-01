import React from "react";
import { notFound } from "next/navigation";
import { NetworkService } from "@/services/network.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { NetworkProfileView } from "@/components/network/network-profile-view";
import { getCurrentUser } from "@/lib/rbac";

import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface NetworkProfilePageProps {
  params: { id: string };
}

export default async function NetworkProfilePage({ params }: NetworkProfilePageProps) {
  const session = await getCurrentUser();

  let profile;
  let isDbError = false;

  try {
    profile = await NetworkService.getPublicProfile(params.id, session?.userId);
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 404) {
      notFound();
    }
    isDbError = true;
    console.error("[NetworkProfilePage] Error fetching profile:", {
      route: `/network/${params.id}`,
      errorCategory: "DATABASE_UNAVAILABLE",
      message: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }

  if (isDbError || !profile) {
    return (
      <MarketplaceShell>
        <div className="py-12 max-w-stitch-container mx-auto px-4 text-center">
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-8 max-w-md mx-auto space-y-4">
            <h2 className="font-heading text-lg font-bold text-amber-900">
              Profile Temporarily Unavailable
            </h2>
            <p className="text-xs text-amber-700 leading-relaxed">
              We are currently unable to connect to the directory database to retrieve this profile. Our team has been notified.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <a
                href="/network"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                Back to Network
              </a>
            </div>
          </div>
        </div>
      </MarketplaceShell>
    );
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

import React from "react";
import { NetworkService } from "@/services/network.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { NetworkDirectoryBrowser } from "@/components/network/network-directory-browser";
import { NetworkDirectorySearchSchema } from "@/lib/validators/network.schema";
import { getCurrentUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

interface NetworkDirectoryPageProps {
  searchParams: {
    search?: string;
    participantType?: string;
    sector?: string;
    category?: string;
    state?: string;
    district?: string;
    verifiedOnly?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
  };
}

export default async function NetworkDirectoryPage({
  searchParams,
}: NetworkDirectoryPageProps) {
  const session = await getCurrentUser();

  const query = {
    search: searchParams.search,
    participantType: searchParams.participantType || "ALL",
    sector: (searchParams.sector as any) || "ALL",
    category: searchParams.category,
    state: searchParams.state,
    district: searchParams.district,
    verifiedOnly: searchParams.verifiedOnly,
    page: searchParams.page ? Number(searchParams.page) : 1,
    pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : 20,
    sortBy: (searchParams.sortBy as any) || "newest",
  };

  const validated = NetworkDirectorySearchSchema.parse(query);
  const result = await NetworkService.searchDirectory(validated, session?.userId);

  return (
    <MarketplaceShell>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">
            B2B Agri-Aqua Business Directory
          </h1>
          <p className="text-xs text-slate-neutral">
            Discover verified farmers, commercial buyers, cold chain service providers, and agricultural enterprises.
          </p>
        </div>

        <NetworkDirectoryBrowser
          initialProfiles={result.items}
          pagination={result.pagination}
        />
      </div>
    </MarketplaceShell>
  );
}

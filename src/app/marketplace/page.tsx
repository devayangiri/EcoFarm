import React from "react";
import { MarketplaceService } from "@/services/marketplace.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { MarketplaceSearchSchema } from "@/lib/validators/marketplace.schema";
import { getCurrentUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

interface MarketplacePageProps {
  searchParams: {
    search?: string;
    sector?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    minMoq?: string;
    maxMoq?: string;
    district?: string;
    state?: string;
    inStockOnly?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
  };
}

export default async function PublicMarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const session = await getCurrentUser();

  const query = {
    search: searchParams.search,
    sector: searchParams.sector || "ALL",
    category: searchParams.category,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    minMoq: searchParams.minMoq,
    maxMoq: searchParams.maxMoq,
    district: searchParams.district,
    state: searchParams.state,
    inStockOnly: searchParams.inStockOnly,
    page: searchParams.page || 1,
    pageSize: searchParams.pageSize || 20,
    sortBy: searchParams.sortBy || "newest",
  };

  const validated = MarketplaceSearchSchema.parse(query);
  let result = {
    items: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
  };
  let facets = {
    categories: [] as { category: string; sector: string }[],
    states: [] as string[],
  };

  try {
    const [fetchedResult, fetchedFacets] = await Promise.all([
      MarketplaceService.searchProducts(validated, session?.userId),
      MarketplaceService.getMarketplaceFacets(),
    ]);
    result = fetchedResult as any;
    facets = fetchedFacets as any;
  } catch (err) {
    console.warn("Marketplace database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <MarketplaceShell>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6">
        <div className="space-y-1 text-left">
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">
            B2B Dual Commodity Marketplace
          </h1>
          <p className="text-xs text-slate-neutral">
            Direct wholesale trade for agricultural crops, grain harvests, live fish, and aquaculture fingerlings.
          </p>
        </div>

        <MarketplaceBrowser
          initialProducts={result.items as any}
          pagination={result.pagination}
          currentSector={(validated.sector as any) || "ALL"}
          facets={facets}
          isBuyerPortal={false}
        />
      </div>
    </MarketplaceShell>
  );
}
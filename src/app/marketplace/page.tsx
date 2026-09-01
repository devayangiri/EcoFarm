import React from "react";
import { MarketplaceService } from "@/services/marketplace.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { MarketplaceSearchSchema } from "@/lib/validators/marketplace.schema";
import { getCurrentUser } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";

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

  let isDbUnavailable = false;

  try {
    const [fetchedResult, fetchedFacets] = await Promise.all([
      MarketplaceService.searchProducts(validated, session?.userId),
      MarketplaceService.getMarketplaceFacets(),
    ]);
    result = fetchedResult as any;
    facets = fetchedFacets as any;
  } catch (err: any) {
    isDbUnavailable = true;
    console.error("[Marketplace] Database query failed:", {
      route: "/marketplace",
      errorCategory: "DATABASE_UNAVAILABLE",
      message: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <AppShell
      currentPath="/marketplace"
      userRole={session?.role || "Guest"}
      userName={session?.fullName || "Welcome"}
    >
      <div className="py-6 max-w-stitch-container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1 text-left">
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">
            B2B Dual Commodity Marketplace
          </h1>
          <p className="text-xs text-slate-neutral">
            Direct wholesale trade for agricultural crops, grain harvests, live fish, and aquaculture fingerlings.
          </p>
        </div>

        {isDbUnavailable ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-8 text-center space-y-4 max-w-xl mx-auto my-8">
            <div className="flex items-center justify-center gap-2 text-amber-800 font-heading font-semibold text-sm">
              <span>Marketplace Catalog Temporarily Unavailable</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              We are currently unable to connect to the commodity catalog database. Our technical team has been notified. Please try refreshing shortly.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <a
                href="/marketplace"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                Retry Connection
              </a>
            </div>
          </div>
        ) : (
          <MarketplaceShell>
            <MarketplaceBrowser
              initialProducts={result.items as any}
              pagination={result.pagination}
              currentSector={(validated.sector as any) || "ALL"}
              facets={facets}
              isBuyerPortal={false}
            />
          </MarketplaceShell>
        )}
      </div>
    </AppShell>
  );
}
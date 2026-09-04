import React from "react";
import { requireRole } from "@/lib/rbac";
import { MarketplaceService } from "@/services/marketplace.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { MarketplaceSearchSchema } from "@/lib/validators/marketplace.schema";

export const dynamic = "force-dynamic";

interface BuyerAgriMarketplacePageProps {
  searchParams: {
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    district?: string;
    state?: string;
    inStockOnly?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
  };
}

export default async function BuyerAgriMarketplacePage({
  searchParams,
}: BuyerAgriMarketplacePageProps) {
  const user = await requireRole("BUYER");

  const query = {
    search: searchParams.search,
    sector: "AGRICULTURE",
    category: searchParams.category,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
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
      MarketplaceService.searchProducts(validated, user.userId),
      MarketplaceService.getMarketplaceFacets(),
    ]);
    result = fetchedResult as any;
    facets = fetchedFacets as any;
  } catch (err) {
    isDbUnavailable = true;
    console.error("[BuyerAgriMarketplace] Database query failed:", {
      route: "/buyer/marketplace/agriculture",
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <AppShell showSidebar userRole="BUYER" userName={user.fullName} currentPath="/buyer/marketplace">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title="Agriculture Produce Marketplace"
          description="Explore high-yield grains, pulses, oilseeds, fresh vegetables, and agro-inputs directly from verified farms."
          breadcrumbs={[
            { label: "Buyer Portal", href: "/buyer" },
            { label: "Marketplace", href: "/buyer/marketplace" },
            { label: "Agriculture", current: true },
          ]}
        />

        {isDbUnavailable ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-8 text-center space-y-4 max-w-xl mx-auto my-8 font-body">
            <div className="flex items-center justify-center gap-2 text-amber-800 font-heading font-bold text-sm">
              <span>Marketplace Catalog Temporarily Unavailable</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              We encountered a temporary database connectivity issue while loading verified agriculture produce. Please try refreshing shortly.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <a
                href="/buyer/marketplace/agriculture"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                Retry Connection
              </a>
            </div>
          </div>
        ) : (
          <MarketplaceBrowser
            initialProducts={result.items as any}
            pagination={result.pagination}
            currentSector="AGRICULTURE"
            facets={facets}
            isBuyerPortal={true}
          />
        )}
      </div>
    </AppShell>
  );
}
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
  const [result, facets] = await Promise.all([
    MarketplaceService.searchProducts(validated, user.userId),
    MarketplaceService.getMarketplaceFacets(),
  ]);

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

        <MarketplaceBrowser
          initialProducts={result.items as any}
          pagination={result.pagination}
          currentSector="AGRICULTURE"
          facets={facets}
          isBuyerPortal={true}
        />
      </div>
    </AppShell>
  );
}
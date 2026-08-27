import React from "react";
import { requireRole } from "@/lib/rbac";
import { MarketplaceService } from "@/services/marketplace.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { MarketplaceSearchSchema } from "@/lib/validators/marketplace.schema";

export const dynamic = "force-dynamic";

interface BuyerAquaMarketplacePageProps {
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

export default async function BuyerAquaMarketplacePage({
  searchParams,
}: BuyerAquaMarketplacePageProps) {
  const user = await requireRole("BUYER");

  const query = {
    search: searchParams.search,
    sector: "AQUACULTURE",
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
          title="Aquaculture & Fish Marketplace"
          description="Source live freshwater carp (Rohu, Catla), hatchery fingerlings, Vannamei shrimp, and quality aqua feed."
          breadcrumbs={[
            { label: "Buyer Portal", href: "/buyer" },
            { label: "Marketplace", href: "/buyer/marketplace" },
            { label: "Aquaculture", current: true },
          ]}
        />

        <MarketplaceBrowser
          initialProducts={result.items as any}
          pagination={result.pagination}
          currentSector="AQUACULTURE"
          facets={facets}
          isBuyerPortal={true}
        />
      </div>
    </AppShell>
  );
}
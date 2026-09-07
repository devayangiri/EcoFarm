import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { BuyerSavedProductsGrid } from "@/components/buyer/buyer-saved-products-grid";
import { EmptyState } from "@/components/ui/empty-state";

import { FEATURES } from "@/config/features";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

interface BuyerSavedProductsPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function BuyerSavedProductsPage({
  searchParams,
}: BuyerSavedProductsPageProps) {
  const user = await requireRole("BUYER");
  const currentPage = Number(searchParams.page) || 1;

  const isAvailable = FEATURES.SAVED_PRODUCTS;
  const result = isAvailable
    ? await BuyerService.getSavedProducts(user.userId, currentPage, 12)
    : { items: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 1 } };
  const items = result.items;
  const pagination = result.pagination;

  return (
    <AppShell showSidebar userRole="BUYER" userName={user.fullName} currentPath="/buyer/saved">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title="Saved Commodities & Lots"
          description="Track price fluctuations, stock changes, and dispatch availability on your bookmarked listings."
          breadcrumbs={[
            { label: "Buyer Portal", href: "/buyer" },
            { label: "Saved Products", current: true },
          ]}
        />

        {!isAvailable ? (
          <EmptyState
            icon={Clock}
            title="Saved Products are coming soon."
            description="Commodity bookmarking, price fluctuation monitoring, and lot tracking will be enabled in Phase 4. Browse the live marketplace catalog to explore available harvests."
            actionLabel="Browse Marketplace"
            actionHref="/buyer/marketplace"
          />
        ) : items.length > 0 ? (
          <BuyerSavedProductsGrid initialItems={items as any} pagination={pagination} />
        ) : (
          <EmptyState
            title="No Saved Products Yet"
            description="Explore the dual agricultural and aquaculture marketplace and bookmark commodities to monitor pricing and lot volumes."
            actionLabel="Browse Marketplace"
            actionHref="/buyer/marketplace"
          />
        )}
      </div>
    </AppShell>
  );
}
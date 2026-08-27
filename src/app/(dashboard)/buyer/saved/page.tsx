import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductCard } from "@/components/cards/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

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

  const result = await BuyerService.getSavedProducts(user.userId, currentPage, 12);
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

        {items.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map((item) => (
                <ProductCard
                  key={item.savedId}
                  id={item.product.id}
                  slug={item.product.slug}
                  title={item.product.title}
                  sector={item.product.sector}
                  category={item.product.category}
                  variety={item.product.variety}
                  pricePerUnit={item.product.pricePerUnit}
                  unit={item.product.unit}
                  availableStock={item.product.availableStock}
                  sellerName={item.product.sellerName}
                  isSellerVerified={item.product.isSellerVerified}
                  locationDistrict={item.product.locationDistrict}
                  locationState={item.product.locationState}
                  imageUrl={item.product.imageUrl}
                  isSaved={true}
                />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pt-4 border-t border-surface-dim">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  pageSize={pagination.limit}
                  onPageChange={() => {}}
                />
              </div>
            )}
          </div>
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
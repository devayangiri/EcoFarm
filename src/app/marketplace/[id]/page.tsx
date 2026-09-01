import React from "react";
import { notFound } from "next/navigation";
import { MarketplaceService } from "@/services/marketplace.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { ProductDetailView } from "@/components/marketplace/product-detail-view";
import { getCurrentUser } from "@/lib/rbac";

import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: { id: string };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const session = await getCurrentUser();

  let product;
  let isDbError = false;

  try {
    product = await MarketplaceService.getProductDetails(params.id, session?.userId);
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 404) {
      notFound();
    }
    isDbError = true;
    console.error("[ProductDetailPage] Error fetching product:", {
      route: `/marketplace/${params.id}`,
      errorCategory: "DATABASE_UNAVAILABLE",
      message: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }

  if (isDbError || !product) {
    return (
      <MarketplaceShell>
        <div className="py-12 max-w-stitch-container mx-auto px-4 text-center">
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-8 max-w-md mx-auto space-y-4">
            <h2 className="font-heading text-lg font-bold text-amber-900">
              Listing Temporarily Unavailable
            </h2>
            <p className="text-xs text-amber-700 leading-relaxed">
              We are currently unable to connect to the catalog database to retrieve this commodity. Our team has been notified.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <a
                href="/marketplace"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                Back to Marketplace
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
        <ProductDetailView
          product={product as any}
          currentUserRole={session?.role}
        />
      </div>
    </MarketplaceShell>
  );
}
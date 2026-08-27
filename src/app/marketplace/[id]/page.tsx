import React from "react";
import { notFound } from "next/navigation";
import { MarketplaceService } from "@/services/marketplace.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { ProductDetailView } from "@/components/marketplace/product-detail-view";
import { getCurrentUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: { id: string };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const session = await getCurrentUser();

  let product;
  try {
    product = await MarketplaceService.getProductDetails(params.id, session?.userId);
  } catch {
    notFound();
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
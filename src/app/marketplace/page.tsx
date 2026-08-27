import React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { ProductCard } from "@/components/cards/product-card";

export const metadata: Metadata = {
  title: "B2B Marketplace | Agri-Aqua Network",
  description: "Browse certified agricultural crops, seeds, freshwater carp, and aquaculture inputs.",
};

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  const sampleProducts = [
    {
      id: "prod-1",
      slug: "swarna-paddy-grain-grade-a-purba-bardhaman",
      title: "Swarna High-Yield Paddy Grain (Grade A)",
      sector: "AGRICULTURE" as const,
      category: "Cereals & Grains",
      variety: "Swarna (MTU 7029)",
      pricePerUnit: 2180.0,
      unit: "QUINTAL",
      availableStock: 500,
      sellerName: "Ramesh Kumar (Swarna Agri)",
      isSellerVerified: true,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
    },
    {
      id: "prod-2",
      slug: "live-premium-rohu-freshwater-fish",
      title: "Live Premium Rohu Fish (Labeo rohita 1.5kg+)",
      sector: "AQUACULTURE" as const,
      category: "Freshwater Fish",
      variety: "Rohu (Labeo rohita)",
      pricePerUnit: 185.0,
      unit: "KG",
      availableStock: 8000,
      sellerName: "Ramesh Kumar (Swarna Agri)",
      isSellerVerified: true,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600",
    },
    {
      id: "prod-3",
      slug: "jyoti-grade-1-cold-store-potato-singur",
      title: "Jyoti Grade-1 Cold-Store Seed Potato",
      sector: "AGRICULTURE" as const,
      category: "Root Vegetables",
      variety: "Kufri Jyoti",
      pricePerUnit: 1450.0,
      unit: "QUINTAL",
      availableStock: 1200,
      sellerName: "Animesh Mondal (Hooghly)",
      isSellerVerified: true,
      locationDistrict: "Hooghly",
      locationState: "West Bengal",
      imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600",
    },
    {
      id: "prod-4",
      slug: "healthy-catla-fingerlings-juvenile-fish-seed",
      title: "Healthy Catla Fingerlings (Juvenile Fish Seed)",
      sector: "AQUACULTURE" as const,
      category: "Fish Seed & Hatchery",
      variety: "Gibelion catla",
      pricePerUnit: 3.5,
      unit: "PIECE",
      availableStock: 50000,
      sellerName: "Animesh Mondal (Hooghly)",
      isSellerVerified: true,
      locationDistrict: "Hooghly",
      locationState: "West Bengal",
      imageUrl: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600",
    },
  ];

  return (
    <AppShell currentPath="/marketplace">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6">
        <PageHeader
          title="B2B Commodity Marketplace"
          description="Source directly from verified farmers and aquaculture producers across India with transparent wholesale pricing."
          breadcrumbs={[{ label: "Marketplace", current: true }]}
        />

        <MarketplaceShell totalProductsCount={sampleProducts.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sampleProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </MarketplaceShell>
      </div>
    </AppShell>
  );
}

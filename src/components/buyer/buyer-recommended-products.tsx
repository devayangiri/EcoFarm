"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProductCard } from "@/components/cards/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAddToCart } from "@/hooks/use-add-to-cart";

export interface BuyerRecommendedProductItem {
  id: string;
  slug?: string;
  title: string;
  sector: "AGRICULTURE" | "AQUACULTURE";
  category: string;
  variety?: string | null;
  pricePerUnit: number;
  unit: string;
  availableStock: number;
  minimumOrderQuantity?: number | null;
  moq?: number | null;
  grade?: string | null;
  sellerName: string;
  isSellerVerified?: boolean;
  locationDistrict: string;
  locationState: string;
  imageUrl?: string | null;
  isInCart?: boolean;
}

export interface BuyerRecommendedProductsProps {
  initialProducts: BuyerRecommendedProductItem[];
}

export function BuyerRecommendedProducts({ initialProducts }: BuyerRecommendedProductsProps) {
  const { addToCart } = useAddToCart();
  const [cartStatusMap, setCartStatusMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    (initialProducts || []).forEach((p) => {
      if (p.isInCart) map[p.id] = true;
    });
    return map;
  });

  const syncCartMembership = useCallback(async () => {
    try {
      const res = await fetch("/api/cart/items");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const map: Record<string, boolean> = {};
          json.data.forEach((id: string) => {
            map[id] = true;
          });
          setCartStatusMap(map);
        }
      }
    } catch {
      // ignore network errors on background sync
    }
  }, []);

  useEffect(() => {
    syncCartMembership();

    const handleCartUpdated = () => {
      syncCartMembership();
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, [syncCartMembership]);

  if (!initialProducts || initialProducts.length === 0) {
    return (
      <EmptyState
        title="No Products Live Currently"
        description="Check back soon as verified farmers and hatcheries upload daily harvests."
        actionLabel="Post Procurement Requirement"
        actionHref="/buyer/requirements"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
      {initialProducts.map((p) => (
        <ProductCard
          key={p.id}
          id={p.id}
          slug={p.slug}
          title={p.title}
          sector={p.sector}
          category={p.category}
          variety={p.variety}
          pricePerUnit={p.pricePerUnit}
          unit={p.unit}
          availableStock={p.availableStock}
          moq={p.minimumOrderQuantity ?? p.moq}
          sellerName={p.sellerName}
          isSellerVerified={p.isSellerVerified}
          locationDistrict={p.locationDistrict}
          locationState={p.locationState}
          imageUrl={p.imageUrl}
          isBuyerPortal={true}
          isInCart={cartStatusMap[p.id] ?? p.isInCart ?? false}
          userRole="BUYER"
          onAddToCart={async (productId) => {
            await addToCart(productId, {
              quantity: p.minimumOrderQuantity ?? p.moq ?? 1,
              slug: p.slug,
              userRole: "BUYER",
              isBuyerPortal: true,
            });
            setCartStatusMap((prev) => ({ ...prev, [productId]: true }));
          }}
        />
      ))}
    </div>
  );
}

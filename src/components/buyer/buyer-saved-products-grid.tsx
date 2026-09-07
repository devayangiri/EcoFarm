"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/cards/product-card";
import { Pagination } from "@/components/ui/pagination";
import { useAddToCart } from "@/hooks/use-add-to-cart";

export interface BuyerSavedItem {
  savedId: string;
  product: {
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
    sellerName: string;
    isSellerVerified?: boolean;
    locationDistrict: string;
    locationState: string;
    imageUrl?: string | null;
    isInCart?: boolean;
  };
}

export interface BuyerSavedProductsGridProps {
  initialItems: BuyerSavedItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function BuyerSavedProductsGrid({ initialItems, pagination }: BuyerSavedProductsGridProps) {
  const router = useRouter();
  const { addToCart } = useAddToCart();
  const [cartStatusMap, setCartStatusMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    (initialItems || []).forEach((item) => {
      if (item.product.isInCart) map[item.product.id] = true;
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
      // ignore
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {initialItems.map((item) => (
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
            moq={item.product.minimumOrderQuantity}
            isSaved={true}
            isInCart={cartStatusMap[item.product.id] ?? item.product.isInCart ?? false}
            isBuyerPortal={true}
            userRole="BUYER"
            onAddToCart={async (productId) => {
              await addToCart(productId, {
                quantity: item.product.minimumOrderQuantity || 1,
                slug: item.product.slug,
                userRole: "BUYER",
                isBuyerPortal: true,
              });
              setCartStatusMap((prev) => ({ ...prev, [productId]: true }));
            }}
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
            onPageChange={(p) => router.push(`/buyer/saved?page=${p}`)}
          />
        </div>
      )}
    </div>
  );
}

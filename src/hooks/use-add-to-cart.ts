"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AddToCartOptions {
  quantity?: number;
  slug?: string;
  userRole?: string | null;
  isBuyerPortal?: boolean;
}

export function useAddToCart() {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = useCallback(
    async (productId: string, options?: AddToCartOptions) => {
      const { quantity, slug, userRole, isBuyerPortal } = options || {};
      const targetIdentifier = slug || productId;

      // Unauthenticated Guest -> redirect to login with callbackUrl
      if (!userRole && !isBuyerPortal) {
        router.push(`/login?callbackUrl=/marketplace/${targetIdentifier}`);
        throw new Error("Authentication required. Please sign in.");
      }

      // Non-buyer role attempting wholesale cart procurement
      if (userRole && userRole !== "BUYER" && !isBuyerPortal) {
        const errMsg = "Only registered commercial buyers can place wholesale orders";
        setError(errMsg);
        throw new Error(errMsg);
      }

      setIsAdding(true);
      setError(null);

      try {
        const res = await fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            quantity: quantity && quantity > 0 ? quantity : 1,
          }),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json.success) {
          if (res.status === 401) {
            router.push(`/login?callbackUrl=/marketplace/${targetIdentifier}`);
            throw new Error("Authentication required. Please sign in.");
          }
          if (res.status === 403) {
            throw new Error("Only registered commercial buyers can place wholesale orders");
          }
          throw new Error(json.message || "Failed to add commodity lot to cart");
        }

        // Global event dispatch for all listeners (header badge, cart view, card state)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cart-updated"));
        }

        // Refresh Server Component tree to update KPI cards (e.g. Procurement Cart count)
        router.refresh();

        return json.data;
      } catch (err: any) {
        const message = err.message || "Failed to add commodity lot to cart";
        setError(message);
        throw err;
      } finally {
        setIsAdding(false);
      }
    },
    [router]
  );

  return {
    addToCart,
    isAdding,
    error,
    clearError: () => setError(null),
  };
}

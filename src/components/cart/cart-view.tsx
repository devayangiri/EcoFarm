"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import {
  Trash2,
  Plus,
  Minus,
  Sprout,
  Waves,
  ArrowRight,
  ShieldCheck,
  Building2,
  Package,
} from "lucide-react";

export interface CartViewProps {
  initialCart: {
    id: string;
    sellerGroups: Array<{
      sellerId: string;
      sellerName: string;
      sellerSubtotal: number;
      items: Array<{
        id: string;
        productId: string;
        productTitle: string;
        slug: string;
        sector: string;
        category: string;
        unit: string;
        pricePerUnit: number;
        quantity: number;
        itemSubtotal: number;
        minimumOrderQuantity: number;
        availableStock: number;
        status: string;
        imageUrl?: string;
      }>;
    }>;
    summary: {
      itemCount: number;
      totalUniqueSellers: number;
      subtotal: number;
      estimatedShipping: number;
      platformCommission: number;
      grandTotal: number;
    };
  };
}

export function CartView({ initialCart }: CartViewProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdateQuantity = async (itemId: string, newQty: number, moq: number, stock: number) => {
    if (newQty < moq) {
      setErrorMessage(`Minimum order quantity is ${moq}`);
      return;
    }
    if (newQty > stock) {
      setErrorMessage(`Maximum available stock is ${stock}`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update quantity");
      }

      router.refresh();
      const updatedCartRes = await fetch("/api/cart");
      const updatedCartJson = await updatedCartRes.json();
      if (updatedCartJson.success) {
        setCart(updatedCartJson.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to remove item");
      }

      router.refresh();
      const updatedCartRes = await fetch("/api/cart");
      const updatedCartJson = await updatedCartRes.json();
      if (updatedCartJson.success) {
        setCart(updatedCartJson.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToCheckout = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to initiate checkout");
      }

      router.push(`/checkout?sessionId=${json.data.sessionId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (cart.summary.itemCount === 0) {
    return (
      <EmptyState
        title="Your Shopping Cart is Empty"
        description="Explore the dual agricultural and aquaculture marketplace to add bulk harvest lots to your order."
        actionLabel="Browse Marketplace"
        actionHref="/marketplace"
      />
    );
  }

  return (
    <div className="space-y-6 font-body text-left">
      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items Grouped by Producer */}
        <div className="lg:col-span-8 space-y-6">
          {cart.sellerGroups.map((group) => (
            <Card key={group.sellerId} className="border border-surface-dim bg-white shadow-sm overflow-hidden">
              <CardHeader className="bg-surface-low border-b border-surface-dim p-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand-primary" />
                  <span className="font-heading font-bold text-sm text-on-surface">
                    Producer: {group.sellerName}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-neutral">
                  Subtotal: <strong className="text-brand-primary">{formatCurrency(group.sellerSubtotal)}</strong>
                </span>
              </CardHeader>

              <CardContent className="p-0 divide-y divide-surface-dim">
                {group.items.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-14 w-14 rounded-md border border-surface-dim overflow-hidden bg-surface-low shrink-0">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.productTitle} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-neutral/40">
                            {item.sector === "AGRICULTURE" ? <Sprout className="h-6 w-6" /> : <Waves className="h-6 w-6" />}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Badge variant={item.sector === "AGRICULTURE" ? "primary" : "secondary"} size="sm" className="mb-1">
                          {item.sector === "AGRICULTURE" ? "Agri" : "Aqua"}
                        </Badge>
                        <h4 className="font-heading font-bold text-sm text-on-surface truncate">{item.productTitle}</h4>
                        <p className="text-xs text-slate-neutral">
                          {formatCurrency(item.pricePerUnit)}/{item.unit} • MOQ: {item.minimumOrderQuantity} {item.unit}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Selector & Item Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-dim">
                      <div className="flex items-center border border-surface-dim rounded-md bg-surface-low">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.minimumOrderQuantity, item.availableStock)}
                          disabled={isLoading || item.quantity <= item.minimumOrderQuantity}
                          className="p-1.5 text-slate-neutral hover:text-on-surface disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 font-mono text-xs font-bold text-on-surface min-w-[36px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.minimumOrderQuantity, item.availableStock)}
                          disabled={isLoading || item.quantity >= item.availableStock}
                          className="p-1.5 text-slate-neutral hover:text-on-surface disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <span className="font-heading font-bold text-sm text-brand-primary block">
                          {formatCurrency(item.itemSubtotal)}
                        </span>
                        <span className="text-[11px] text-slate-neutral">
                          {item.quantity} {item.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isLoading}
                        className="text-slate-neutral hover:text-status-error transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Order Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-5">
            <CardHeader className="p-0">
              <CardTitle className="text-base font-bold">Order Summary</CardTitle>
            </CardHeader>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-surface-dim">
                <span className="text-slate-neutral">Total Commodities:</span>
                <span className="font-bold text-on-surface">{cart.summary.itemCount} Lots</span>
              </div>

              <div className="flex justify-between py-1 border-b border-surface-dim">
                <span className="text-slate-neutral">Independent Producers:</span>
                <span className="font-bold text-on-surface">{cart.summary.totalUniqueSellers} Sellers</span>
              </div>

              <div className="flex justify-between py-1 border-b border-surface-dim">
                <span className="text-slate-neutral">Commodity Subtotal:</span>
                <span className="font-mono font-bold text-on-surface">{formatCurrency(cart.summary.subtotal)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-surface-dim">
                <span className="text-slate-neutral">Estimated Multi-Vendor Freight:</span>
                <span className="font-mono font-bold text-on-surface">{formatCurrency(cart.summary.estimatedShipping)}</span>
              </div>

              <div className="flex justify-between py-2 text-sm pt-2">
                <span className="font-heading font-bold text-on-surface">Grand Total:</span>
                <span className="font-heading text-xl font-extrabold text-brand-primary">
                  {formatCurrency(cart.summary.grandTotal)}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleProceedToCheckout}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { CartService } from "@/services/cart.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { CartView } from "@/components/cart/cart-view";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "BUYER") {
    redirect("/login?callbackUrl=/cart");
  }

  const cart = await CartService.getCart(session.userId);

  return (
    <MarketplaceShell>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6">
        <div className="space-y-1 text-left">
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">
            Wholesale Procurement Cart
          </h1>
          <p className="text-xs text-slate-neutral">
            Review commodity lots, producer batches, and multi-vendor shipment freight before initiating checkout.
          </p>
        </div>

        <CartView initialCart={cart as any} />
      </div>
    </MarketplaceShell>
  );
}
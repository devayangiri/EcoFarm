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

  let cart = {
    id: "",
    buyerId: session.userId,
    status: "ACTIVE",
    sellerGroups: [],
    summary: {
      itemCount: 0,
      totalUniqueSellers: 0,
      subtotal: 0,
      estimatedShipping: 0,
      platformCommission: 0,
      grandTotal: 0,
    },
  };

  try {
    cart = (await CartService.getCart(session.userId)) as any;
  } catch (error) {
    console.error("[CartPage] Error retrieving cart:", error);
  }

  return (
    <MarketplaceShell>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6">
        <div className="space-y-1 text-left">
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">
            Wholesale Procurement Cart
          </h1>
          <p className="text-xs text-slate-neutral">
            Multi-vendor wholesale procurement cart and integrated checkout.
          </p>
        </div>

        <CartView initialCart={cart} />
      </div>
    </MarketplaceShell>
  );
}
import React from "react";
import { requireRole } from "@/lib/rbac";
import { CartService } from "@/services/cart.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { CartView } from "@/components/cart/cart-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function BuyerCartPage() {
  const user = await requireRole("BUYER");

  let cart = {
    id: "",
    buyerId: user.userId,
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
    cart = (await CartService.getCart(user.userId)) as any;
  } catch (error) {
    console.error("[BuyerCartPage] Error retrieving cart:", error);
  }

  return (
    <AppShell showSidebar userRole="BUYER" userName={user.fullName} currentPath="/buyer/cart">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title="Wholesale Procurement Cart"
          description="Multi-vendor commodity aggregation, freight estimation, and direct settlement."
          breadcrumbs={[
            { label: "Buyer Portal", href: "/buyer" },
            { label: "Cart", current: true },
          ]}
        />

        <CartView initialCart={cart} />
      </div>
    </AppShell>
  );
}

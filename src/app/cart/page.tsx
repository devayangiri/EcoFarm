import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { FEATURES } from "@/config/features";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await getCurrentUser();
  if (!session || session.role !== "BUYER") {
    redirect("/login?callbackUrl=/cart");
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

        <EmptyState
          icon={Clock}
          title="Wholesale Cart is coming soon."
          description="Multi-vendor shopping cart, freight aggregation, and direct checkout are scheduled for Phase 8. Currently, buyers can explore listings and initiate direct inquiries with verified producers."
          actionLabel="Explore Marketplace"
          actionHref="/buyer/marketplace"
        />
      </div>
    </MarketplaceShell>
  );
}
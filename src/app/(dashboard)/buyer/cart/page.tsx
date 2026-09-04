import React from "react";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BuyerCartPage() {
  const user = await requireRole("BUYER");

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

        <EmptyState
          icon={Clock}
          title="Wholesale Cart is coming soon."
          description="Multi-vendor shopping cart, freight aggregation, and direct checkout are scheduled for Phase 8. Currently, buyers can explore listings and initiate direct inquiries with verified producers."
          actionLabel="Explore Marketplace"
          actionHref="/buyer/marketplace"
        />
      </div>
    </AppShell>
  );
}

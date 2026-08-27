import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/rbac";
import { OrderService } from "@/services/order.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { Package, Truck, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage() {
  const session = await getCurrentUser();
  const { orderGroups } = await OrderService.getBuyerOrderGroups(session!.userId);

  return (
    <AppShell userRole="BUYER" userName={session?.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-on-surface">Purchase Orders & Shipments</h1>
          <p className="text-xs text-slate-neutral">
            Track multi-vendor procurement orders, producer dispatches, and delivery timelines.
          </p>
        </div>

        {orderGroups.length === 0 ? (
          <EmptyState
            title="No Orders Placed Yet"
            description="Browse agricultural and aquacultural commodities in the wholesale marketplace to place your first bulk order."
            actionLabel="Explore Marketplace"
            actionHref="/marketplace"
          />
        ) : (
          <div className="space-y-4">
            {orderGroups.map((group) => (
              <Card key={group.id} className="border border-surface-dim bg-white shadow-sm overflow-hidden">
                <CardHeader className="p-4 bg-surface-low border-b border-surface-dim flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-brand-primary">
                        {group.orderNumber}
                      </span>
                      <Badge variant={group.status === "COMPLETED" ? "success" : "info"} size="sm">
                        {group.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-neutral block">
                      Placed on {new Date(group.createdAt).toLocaleDateString()} • {group.sellerOrders.length} Sub-Order(s)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-heading font-extrabold text-base text-brand-primary block">
                      {formatCurrency(group.totalAmount.toNumber())}
                    </span>
                    <Link href={`/buyer/orders/${group.id}`}>
                      <Button variant="outline" size="sm" className="gap-1 mt-1 text-xs">
                        <span>Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="p-4 divide-y divide-surface-dim">
                  {group.sellerOrders.map((subOrder) => (
                    <div key={subOrder.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-on-surface">Producer: {subOrder.seller.fullName}</span>
                        <p className="text-slate-neutral mt-0.5">
                          {subOrder.items.map((it) => `${it.productTitleSnapshot} (${it.quantity.toString()} ${it.unitSnapshot})`).join(", ")}
                        </p>
                      </div>
                      <Badge variant={subOrder.status === "DELIVERED" ? "success" : "secondary"} size="sm">
                        {subOrder.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

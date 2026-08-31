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
import { Package, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FarmerOrdersPage() {
  const session = await getCurrentUser();
  let orders: any[] = [];
  try {
    if (session?.userId) {
      const res = await OrderService.getSellerOrders(session.userId);
      orders = res.orders;
    }
  } catch (err) {
    console.warn("Farmer orders database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <AppShell showSidebar userRole="FARMER" userName={session?.fullName} currentPath="/farmer/orders">
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-on-surface">Producer Sales & Fulfillment</h1>
          <p className="text-xs text-slate-neutral">
            Manage incoming purchase orders from verified wholesale buyers, update dispatch milestones, and enter tracking numbers.
          </p>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="No Sales Orders Yet"
            description="When buyers purchase your listed agricultural crops or aquaculture fingerlings, orders will appear here for fulfillment."
            actionLabel="View Active Products"
            actionHref="/farmer/products"
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border border-surface-dim bg-white shadow-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-dim pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-brand-primary">
                        {order.subOrderNumber}
                      </span>
                      <Badge variant={order.status === "DELIVERED" ? "success" : "secondary"} size="sm">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-neutral">
                      Buyer: <strong className="text-on-surface">{order.orderGroup.buyer.fullName}</strong> • Placed {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-heading font-extrabold text-base text-brand-primary block">
                      {formatCurrency(order.sellerTotal.toNumber())}
                    </span>
                    <Link
                      href={`/farmer/orders/${order.id}`}
                      className="inline-flex items-center justify-center font-heading font-semibold text-xs h-8 px-3 rounded-sm gap-1 mt-1 border border-surface-dim bg-white text-on-surface hover:bg-surface-low hover:border-brand-secondary/40 shadow-sm transition-all"
                    >
                      <span>Fulfill Order</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="text-xs text-slate-neutral space-y-1">
                  <span className="font-semibold text-on-surface">Items Ordered:</span>
                  <p>{order.items.map((it: any) => `${it.productTitleSnapshot} (${it.quantity.toString()} ${it.unitSnapshot})`).join(", ")}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

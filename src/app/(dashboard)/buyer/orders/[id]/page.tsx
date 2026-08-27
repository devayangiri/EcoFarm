import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/rbac";
import { OrderService } from "@/services/order.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTrackingTimeline } from "@/components/orders/order-tracking-timeline";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: { id: string };
}

export default async function BuyerOrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getCurrentUser();

  let group;
  try {
    group = await OrderService.getBuyerOrderGroupById(session!.userId, params.id);
  } catch {
    notFound();
  }

  const shipping = group.shippingAddressSnapshot as any;

  return (
    <AppShell userRole="BUYER" userName={session?.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <Link
          href="/buyer/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-neutral hover:text-brand-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-dim pb-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-on-surface">Order {group.orderNumber}</h1>
            <p className="text-xs text-slate-neutral">
              Placed on {new Date(group.createdAt).toLocaleString()}
            </p>
          </div>
          <Badge variant={group.status === "COMPLETED" ? "success" : "info"} size="md">
            {group.status}
          </Badge>
        </div>

        {/* Shipping Address Snapshot */}
        {shipping && (
          <Card className="border border-surface-dim bg-white shadow-sm p-4 text-xs space-y-1">
            <span className="font-heading font-bold text-on-surface block">Immutable Delivery Destination:</span>
            <p className="text-slate-neutral leading-relaxed">
              {shipping.recipientName} ({shipping.recipientPhone})<br />
              {shipping.villageOrStreet}, {shipping.cityOrTown}, {shipping.district}, {shipping.state} - {shipping.pincode}
            </p>
          </Card>
        )}

        {/* Sub-Orders per Seller */}
        <div className="space-y-6">
          {group.sellerOrders.map((sub) => (
            <Card key={sub.id} className="border border-surface-dim bg-white shadow-sm p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-surface-dim pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand-primary" />
                  <span className="font-heading font-bold text-sm text-on-surface">
                    Producer: {sub.seller.fullName} ({sub.subOrderNumber})
                  </span>
                </div>
                <Badge variant={sub.status === "DELIVERED" ? "success" : "secondary"} size="sm">
                  {sub.status}
                </Badge>
              </div>

              {/* Items */}
              <div className="divide-y divide-surface-dim border border-surface-dim rounded-lg overflow-hidden">
                {sub.items.map((it) => (
                  <div key={it.id} className="p-3 flex items-center justify-between text-xs bg-surface-low">
                    <div>
                      <span className="font-bold text-on-surface block">{it.productTitleSnapshot}</span>
                      <span className="text-slate-neutral">
                        {formatCurrency(it.unitPrice.toNumber())}/{it.unitSnapshot}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-brand-primary block">
                        {formatCurrency(it.totalPrice.toNumber())}
                      </span>
                      <span className="text-slate-neutral">{it.quantity.toString()} {it.unitSnapshot}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <OrderTrackingTimeline
                currentStatus={sub.status}
                timeline={sub.timeline as any}
              />
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

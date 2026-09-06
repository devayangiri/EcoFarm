import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/rbac";
import { OrderService } from "@/services/order.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTrackingTimeline } from "@/components/orders/order-tracking-timeline";
import { CancelOrderDialog } from "@/components/orders/cancel-order-dialog";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, Building2, Star } from "lucide-react";

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
          <div className="flex items-center gap-2">
            <Badge
              variant={
                group.status === "COMPLETED"
                  ? "success"
                  : group.status === "CANCELLED"
                  ? "error"
                  : "info"
              }
              size="md"
            >
              {group.status}
            </Badge>
            {group.status !== "CANCELLED" &&
              group.sellerOrders.some((so) => so.status === "PLACED" || so.status === "CONFIRMED") &&
              group.sellerOrders.length > 1 && (
                <CancelOrderDialog
                  orderId={group.id}
                  orderNumber={group.orderNumber}
                  isGroup={true}
                  buttonSize="sm"
                />
              )}
          </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-dim pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand-primary" />
                  <span className="font-heading font-bold text-sm text-on-surface">
                    Producer: {sub.seller.fullName} ({sub.subOrderNumber})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      sub.status === "DELIVERED" || sub.status === "COMPLETED"
                        ? "success"
                        : sub.status.startsWith("CANCELLED")
                        ? "error"
                        : "secondary"
                    }
                    size="sm"
                  >
                    {sub.status}
                  </Badge>
                  {(sub.status === "PLACED" || sub.status === "CONFIRMED") && (
                    <CancelOrderDialog
                      orderId={sub.id}
                      orderNumber={sub.subOrderNumber}
                      isGroup={false}
                      buttonSize="sm"
                    />
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-surface-dim border border-surface-dim rounded-lg overflow-hidden">
                {sub.items.map((it) => (
                  <div key={it.id} className="p-3 text-xs bg-surface-low space-y-1">
                    <div className="flex items-center justify-between">
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

                    {(sub.status === "DELIVERED" || sub.status === "COMPLETED") && (
                      <div className="pt-1 flex justify-end">
                        <Link
                          href={`/marketplace/${it.productId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline bg-white px-2 py-0.5 rounded border border-surface-dim"
                        >
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          <span>Rate & Review Commodity</span>
                        </Link>
                      </div>
                    )}
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

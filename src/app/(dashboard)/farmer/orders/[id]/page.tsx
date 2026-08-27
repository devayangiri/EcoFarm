import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/rbac";
import { OrderService } from "@/services/order.service";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTrackingTimeline } from "@/components/orders/order-tracking-timeline";
import { FarmerOrderStatusUpdater } from "@/components/orders/farmer-order-status-updater";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface FarmerOrderDetailPageProps {
  params: { id: string };
}

export default async function FarmerOrderDetailPage({ params }: FarmerOrderDetailPageProps) {
  const session = await getCurrentUser();

  let order;
  try {
    order = await OrderService.getSellerOrderById(session!.userId, params.id);
  } catch {
    notFound();
  }

  const shipping = order.orderGroup.shippingAddressSnapshot as any;

  return (
    <AppShell userRole="FARMER" userName={session?.fullName}>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body max-w-4xl">
        <Link
          href="/farmer/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-neutral hover:text-brand-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Sales Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-dim pb-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-on-surface">Fulfill Order {order.subOrderNumber}</h1>
            <p className="text-xs text-slate-neutral">
              Buyer: {order.orderGroup.buyer.fullName} • Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <Badge variant={order.status === "DELIVERED" ? "success" : "secondary"} size="md">
            {order.status}
          </Badge>
        </div>

        {/* Status Update Control */}
        <FarmerOrderStatusUpdater
          orderId={order.id}
          currentStatus={order.status}
          currentTracking={order.trackingNumber}
          currentCourier={order.shippingCourier}
        />

        {/* Delivery Destination */}
        {shipping && (
          <Card className="border border-surface-dim bg-white shadow-sm p-4 text-xs space-y-1">
            <span className="font-heading font-bold text-on-surface block">Buyer Dispatch Destination:</span>
            <p className="text-slate-neutral leading-relaxed">
              {shipping.recipientName} ({shipping.recipientPhone})<br />
              {shipping.villageOrStreet}, {shipping.cityOrTown}, {shipping.district}, {shipping.state} - {shipping.pincode}
            </p>
          </Card>
        )}

        {/* Order Items */}
        <Card className="border border-surface-dim bg-white shadow-sm p-4 space-y-3">
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-neutral block">
            Commodity Lots in this Shipment
          </span>
          <div className="divide-y divide-surface-dim border border-surface-dim rounded-lg overflow-hidden">
            {order.items.map((it) => (
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
        </Card>

        {/* Fulfillment Timeline */}
        <Card className="border border-surface-dim bg-white shadow-sm p-5">
          <OrderTrackingTimeline
            currentStatus={order.status}
            timeline={order.timeline as any}
          />
        </Card>
      </div>
    </AppShell>
  );
}

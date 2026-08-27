"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, AlertCircle } from "lucide-react";
import { OrderStatus } from "@prisma/client";

export interface OrderSupervisionItem {
  id: string;
  subOrderNumber: string;
  buyer: { id: string; fullName: string; email: string };
  seller: { id: string; fullName: string; email: string };
  sellerTotal: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
}

export function OrderSupervisionView({ initialOrders }: { initialOrders: OrderSupervisionItem[] }) {
  const [orders, setOrders] = useState<OrderSupervisionItem[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<OrderSupervisionItem | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleIssue = (order: OrderSupervisionItem) => {
    setSelectedOrder(order);
    setReason("");
    setFeedback(null);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL_ORDER", reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to process order override");

      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: "CANCELLED_BY_SELLER" } : o))
      );
      setFeedback({ type: "success", message: `Order #${selectedOrder.subOrderNumber} administratively cancelled.` });
      setSelectedOrder(null);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="border-b border-surface-dim pb-4 space-y-1">
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
          Order Supervision
        </h1>
        <p className="text-xs text-slate-neutral">
          Monitor multi-vendor commerce orders, review financial totals, and execute operational exceptions.
        </p>
      </div>

      {feedback && <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>{feedback.message}</Alert>}

      <Card className="p-0 bg-white border border-surface-dim shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-low border-b border-surface-dim font-heading font-semibold text-slate-neutral">
              <tr>
                <th className="p-3">Order #</th>
                <th className="p-3">Buyer</th>
                <th className="p-3">Seller</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dim">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-low/50">
                  <td className="p-3 font-semibold text-on-surface">#{o.subOrderNumber}</td>
                  <td className="p-3">{o.buyer.fullName}</td>
                  <td className="p-3">{o.seller.fullName}</td>
                  <td className="p-3 font-semibold text-brand-primary">{formatCurrency(o.sellerTotal)}</td>
                  <td className="p-3"><Badge variant="secondary" size="sm">{o.status}</Badge></td>
                  <td className="p-3 text-slate-neutral">{formatDate(o.createdAt)}</td>
                  <td className="p-3 text-right">
                    {o.status !== "CANCELLED_BY_BUYER" && o.status !== "CANCELLED_BY_SELLER" && (
                      <Button variant="outline" size="sm" onClick={() => handleIssue(o)} className="text-[11px] h-7 px-2 text-status-error">
                        Cancel Force
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-surface-dim text-left">
            <h3 className="font-heading font-bold text-base text-on-surface">
              Operational Override: #{selectedOrder.subOrderNumber}
            </h3>
            <p className="text-xs text-slate-neutral">
              Administratively cancel this order. Historical financial line items remain recorded in audit log.
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-on-surface">Operational Reason *</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State administrative justification..."
                className="w-full rounded-lg border border-surface-dim bg-surface-low p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmCancel} disabled={!reason.trim() || isSubmitting} isLoading={isSubmitting}>
                Confirm Override
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingBag, CheckCircle, XCircle, PauseCircle, PlayCircle } from "lucide-react";
import { ProductStatus, Sector } from "@prisma/client";

export interface ProductItem {
  id: string;
  title: string;
  sector: Sector;
  category: string;
  pricePerUnit: number;
  unit: string;
  availableStock: number;
  status: ProductStatus;
  seller: { id: string; fullName: string; email: string };
  thumbnail?: string | null;
  location: string;
  createdAt: string;
}

export function ProductModerationView({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "PAUSE" | "RESTORE" | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const filtered = products.filter((p) => selectedStatus === "ALL" || p.status === selectedStatus);

  const handleAction = (product: ProductItem, action: "APPROVE" | "REJECT" | "PAUSE" | "RESTORE") => {
    setSelectedProduct(product);
    setActionType(action);
    setReason("");
    setFeedback(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedProduct || !actionType) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct.id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, reason }),
      });
      const json = await res.json();
      const errorMessage =
        json.error?.message ||
        json.message ||
        "Failed to moderate product";
      if (!res.ok || !json.success) throw new Error(errorMessage);

      let nextStatus: ProductStatus = selectedProduct.status;
      if (actionType === "APPROVE" || actionType === "RESTORE") nextStatus = "ACTIVE";
      if (actionType === "REJECT") nextStatus = "REJECTED";
      if (actionType === "PAUSE") nextStatus = "PAUSED";

      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...p, status: nextStatus } : p))
      );
      setFeedback({ type: "success", message: `Product "${selectedProduct.title}" ${actionType.toLowerCase()}d.` });
      setSelectedProduct(null);
      setActionType(null);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
        <div className="space-y-1">
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
            Product Catalog Moderation
          </h1>
          <p className="text-xs text-slate-neutral">
            Review submissions, ensure price & listing guidelines, and manage catalog status.
          </p>
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 px-3 rounded-lg border border-surface-dim bg-surface-low text-xs text-on-surface"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING_MODERATION">Pending Moderation</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft (Unsubmitted)</option>
        </select>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Card key={p.id} className="p-4 bg-white border border-surface-dim shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Badge variant={p.sector === "AGRICULTURE" ? "primary" : "secondary"} size="sm">
                  {p.sector}
                </Badge>
                <Badge
                  variant={
                    p.status === "ACTIVE"
                      ? "primary"
                      : p.status === "PENDING_MODERATION"
                      ? "warning"
                      : p.status === "DRAFT"
                      ? "neutral"
                      : "error"
                  }
                  size="sm"
                >
                  {p.status === "DRAFT" ? "DRAFT (UNSUBMITTED)" : p.status}
                </Badge>
              </div>

              <div>
                <strong className="font-heading font-bold text-sm text-on-surface line-clamp-1 block">
                  {p.title}
                </strong>
                <span className="text-xs text-slate-neutral">{p.category} • {p.location}</span>
              </div>

              <div className="text-xs flex items-center justify-between border-t border-b border-surface-dim py-2">
                <div>
                  <span className="text-slate-neutral block text-[10px]">Price</span>
                  <strong className="font-semibold text-brand-primary">{formatCurrency(p.pricePerUnit)} / {p.unit}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-neutral block text-[10px]">Stock</span>
                  <strong className="font-semibold text-on-surface">{p.availableStock} {p.unit}</strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-neutral">
                Seller: <strong>{p.seller.fullName}</strong> ({p.seller.email})
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-surface-dim">
              {p.status === "PENDING_MODERATION" && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAction(p, "APPROVE")}
                    className="text-xs flex-1 h-8 gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(p, "REJECT")}
                    className="text-xs flex-1 h-8 gap-1 text-status-error hover:bg-status-error/10"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </>
              )}
              {p.status === "ACTIVE" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(p, "PAUSE")}
                  className="text-xs flex-1 h-8 gap-1 text-status-warning"
                >
                  <PauseCircle className="h-3.5 w-3.5" />
                  Pause
                </Button>
              )}
              {p.status === "PAUSED" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAction(p, "RESTORE")}
                  className="text-xs flex-1 h-8 gap-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Restore
                </Button>
              )}
              {p.status === "DRAFT" && (
                <span className="text-[11px] text-slate-neutral italic py-1 w-full text-center">
                  Awaiting Seller Submission
                </span>
              )}
              {p.status === "REJECTED" && (
                <span className="text-[11px] text-status-error italic py-1 w-full text-center">
                  Rejected (Awaiting Seller Resubmission)
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {actionType && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-surface-dim text-left">
            <h3 className="font-heading font-bold text-base text-on-surface">
              Moderate Product: {selectedProduct.title} ({actionType})
            </h3>
            <p className="text-xs text-slate-neutral">
              Action: <strong>{actionType}</strong>. The seller will be notified automatically.
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-on-surface">Moderator Reason / Note</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State reason or change requirements for seller..."
                className="w-full rounded-lg border border-surface-dim bg-surface-low p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
              <Button variant="outline" size="sm" onClick={() => setActionType(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmAction} isLoading={isSubmitting}>
                Confirm Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

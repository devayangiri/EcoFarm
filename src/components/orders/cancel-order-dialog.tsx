"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Ban, AlertCircle } from "lucide-react";

interface CancelOrderDialogProps {
  orderId: string;
  orderNumber: string;
  isGroup?: boolean;
  buttonSize?: "sm" | "md" | "lg";
  buttonVariant?: "outline" | "danger";
  buttonClassName?: string;
  onSuccess?: () => void;
}

const COMMON_REASONS = [
  "Ordered by mistake",
  "Found better price elsewhere",
  "Delivery timeline is too long",
  "Procurement requirements changed",
  "Incorrect commodity quantity specified",
  "Other reason (please specify)",
];

export function CancelOrderDialog({
  orderId,
  orderNumber,
  isGroup = false,
  buttonSize = "sm",
  buttonVariant = "outline",
  buttonClassName = "text-status-error border-status-error/40 hover:bg-status-error/5 hover:border-status-error",
  onSuccess,
}: CancelOrderDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customDetails, setCustomDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setSelectedReason(COMMON_REASONS[0]);
    setCustomDetails("");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isLoading) return;
    setIsOpen(false);
    setError(null);
  };

  const handleConfirmCancel = async () => {
    setIsLoading(true);
    setError(null);

    let finalReason = selectedReason;
    if (selectedReason === "Other reason (please specify)") {
      if (!customDetails.trim() || customDetails.trim().length < 3) {
        setError("Please specify the cancellation reason (minimum 3 characters).");
        setIsLoading(false);
        return;
      }
      finalReason = customDetails.trim();
    } else if (customDetails.trim()) {
      finalReason = `${selectedReason} - ${customDetails.trim()}`;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: finalReason }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to cancel order");
      }

      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while cancelling the order.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleOpen}
        className={buttonClassName}
        leftIcon={<Ban className="h-3.5 w-3.5" />}
      >
        Cancel {isGroup ? "All Sub-Orders" : "Order"}
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        maxWidth="md"
        title={`Cancel ${isGroup ? "Entire Order" : "Shipment"}: ${orderNumber}`}
        description="Verify cancellation details before proceeding."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              Keep Order
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmCancel}
              isLoading={isLoading}
              leftIcon={<Ban className="h-4 w-4" />}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-1 text-xs">
          {/* Warning Banner */}
          <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg flex items-start gap-2.5 text-status-error">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Permanent Action</span>
              <p className="text-[11px] leading-relaxed opacity-90 text-on-surface">
                Cancelling this order is permanent. Reserved wholesale lot quantities will be released
                back to the verified producer&apos;s active marketplace stock immediately.
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label htmlFor="cancel-reason-select" className="font-semibold text-slate-neutral block">
              Reason for Cancellation <span className="text-status-error">*</span>
            </label>
            <select
              id="cancel-reason-select"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isLoading}
              className="w-full p-2.5 rounded-lg border border-surface-dim bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Optional / Required Details */}
          <div className="space-y-1.5">
            <label htmlFor="cancel-details-text" className="font-semibold text-slate-neutral block">
              {selectedReason === "Other reason (please specify)"
                ? "Cancellation Explanation *"
                : "Additional Notes (Optional)"}
            </label>
            <textarea
              id="cancel-details-text"
              rows={3}
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              disabled={isLoading}
              placeholder="Provide context for the producer regarding this cancellation..."
              className="w-full p-2.5 rounded-lg border border-surface-dim bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-status-error/10 border border-status-error/30 rounded-lg flex items-center gap-2 text-status-error text-[11px]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}

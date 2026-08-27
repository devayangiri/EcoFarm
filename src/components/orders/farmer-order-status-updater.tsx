"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { OrderStatus } from "@prisma/client";

export interface FarmerOrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
  currentTracking?: string | null;
  currentCourier?: string | null;
}

export function FarmerOrderStatusUpdater({
  orderId,
  currentStatus,
  currentTracking,
  currentCourier,
}: FarmerOrderStatusUpdaterProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState(currentTracking || "");
  const [shippingCourier, setShippingCourier] = useState(currentCourier || "");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/farmer/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || null,
          shippingCourier: shippingCourier || null,
          note: note || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update status");
      }

      setSuccessMessage(`Order milestone updated to ${status}`);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-surface-dim bg-white shadow-sm p-4 space-y-4 font-body text-left">
      <CardHeader className="p-0">
        <CardTitle className="text-sm font-bold">Update Shipment & Fulfillment Milestone</CardTitle>
      </CardHeader>

      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Next Milestone Status" required>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { label: "PLACED (Waiting Confirmation)", value: "PLACED" },
                { label: "CONFIRMED (Accepted)", value: "CONFIRMED" },
                { label: "PROCESSING (Harvesting/Packing)", value: "PROCESSING" },
                { label: "SHIPPED (In Transit)", value: "SHIPPED" },
                { label: "DELIVERED (Delivered to Buyer)", value: "DELIVERED" },
                { label: "COMPLETED (Settled)", value: "COMPLETED" },
                { label: "CANCELLED_BY_SELLER (Stock Issue)", value: "CANCELLED_BY_SELLER" },
              ]}
            />
          </FormField>

          <FormField label="Courier / Transport Agent">
            <Input
              value={shippingCourier}
              onChange={(e) => setShippingCourier(e.target.value)}
              placeholder="e.g. AgriLogistics Express"
            />
          </FormField>

          <FormField label="Tracking / Waybill No.">
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. WB-98765432"
            />
          </FormField>
        </div>

        <FormField label="Fulfillment Note for Buyer">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Harvested fresh this morning, loaded into refrigerated truck."
          />
        </FormField>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Update Order Status
          </Button>
        </div>
      </form>
    </Card>
  );
}
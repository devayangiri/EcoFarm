"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export interface BuyerProfileFormProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    role: string;
    status: string;
    buyerProfile?: {
      id: string;
      companyName?: string | null;
      buyerType: string;
      gstNumber?: string | null;
      address?: {
        villageOrStreet?: string;
        cityOrTown?: string;
        district?: string;
        state?: string;
        pincode?: string;
      } | null;
    } | null;
  };
}

export function BuyerProfileForm({ user }: BuyerProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    companyName: user.buyerProfile?.companyName || "",
    buyerType: user.buyerProfile?.buyerType || "WHOLESALER",
    gstNumber: user.buyerProfile?.gstNumber || "",
    villageOrStreet: user.buyerProfile?.address?.villageOrStreet || "",
    cityOrTown: user.buyerProfile?.address?.cityOrTown || "",
    district: user.buyerProfile?.address?.district || "",
    state: user.buyerProfile?.address?.state || "",
    pincode: user.buyerProfile?.address?.pincode || "",
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone || null,
        companyName: formData.companyName || null,
        buyerType: formData.buyerType,
        gstNumber: formData.gstNumber || null,
        villageOrStreet: formData.villageOrStreet || undefined,
        cityOrTown: formData.cityOrTown || undefined,
        district: formData.district || undefined,
        state: formData.state || undefined,
        pincode: formData.pincode || null,
      };

      const res = await fetch("/api/buyer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update profile");
      }

      setSuccessMessage("Buyer business profile updated successfully");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-body text-left max-w-2xl mx-auto">
      {successMessage && (
        <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <Card className="border border-surface-dim bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Buyer Account & Business Entity</CardTitle>
            <Badge variant="success">{user.status}</Badge>
          </div>
          <CardDescription className="text-xs">
            Commercial details used for wholesale purchase orders and tax invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Representative Full Name" required>
              <Input
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
              />
            </FormField>

            <FormField label="Company / Entity Name">
              <Input
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="e.g. Bengal Agri Processing Ltd."
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Buyer Trade Category" required>
              <Select
                value={formData.buyerType}
                onChange={(e) => updateField("buyerType", e.target.value)}
                options={[
                  { value: "WHOLESALER", label: "Wholesaler / Trader" },
                  { value: "PROCESSOR", label: "Food Processing Unit / Mill" },
                  { value: "EXPORTER", label: "Exporter / Bulk Shipper" },
                  { value: "RETAILER", label: "Retail Chain / Supermarket" },
                  { value: "INSTITUTION", label: "Institutional Buyer / Hotel" },
                  { value: "INDIVIDUAL", label: "Individual / Local Merchant" },
                ]}
              />
            </FormField>

            <FormField label="GSTIN / Tax ID" hint="15-digit Indian GST number">
              <Input
                value={formData.gstNumber}
                onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
                placeholder="e.g. 19AAAAA0000A1Z5"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email Address (Read-Only)">
              <Input value={user.email} disabled className="bg-surface-low" />
            </FormField>

            <FormField label="Primary Contact Phone">
              <Input
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+919876543210"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-surface-dim bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Delivery & Billing Address</CardTitle>
          <CardDescription className="text-xs">
            Warehouse or receiving facility location for wholesale dispatches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Warehouse / Facility / Street">
            <Input
              value={formData.villageOrStreet}
              onChange={(e) => updateField("villageOrStreet", e.target.value)}
              placeholder="e.g. Unit 4, Commercial Hub"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="City / Town">
              <Input
                value={formData.cityOrTown}
                onChange={(e) => updateField("cityOrTown", e.target.value)}
                placeholder="City"
              />
            </FormField>

            <FormField label="District">
              <Input
                value={formData.district}
                onChange={(e) => updateField("district", e.target.value)}
                placeholder="District"
              />
            </FormField>

            <FormField label="State">
              <Input
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="State"
              />
            </FormField>
          </div>

          <FormField label="PIN Code">
            <Input
              value={formData.pincode}
              onChange={(e) => updateField("pincode", e.target.value)}
              placeholder="700001"
            />
          </FormField>

          <div className="flex justify-end pt-2">
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Save Business Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
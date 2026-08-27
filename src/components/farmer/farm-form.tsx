"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";

export interface FarmFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: string;
    name?: string;
    sector?: "AGRICULTURE" | "AQUACULTURE";
    totalAreaAcres?: number;
    waterSourceType?: string | null;
    soilType?: string | null;
    address?: {
      villageOrStreet?: string;
      cityOrTown?: string;
      district?: string;
      state?: string;
      pincode?: string;
    } | null;
  };
}

export function FarmForm({ isOpen, onClose, initialData }: FarmFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sector: initialData?.sector || "AGRICULTURE",
    totalAreaAcres: initialData?.totalAreaAcres ? String(initialData.totalAreaAcres) : "5.00",
    waterSourceType: initialData?.waterSourceType || "Canal & Borewell",
    soilType: initialData?.soilType || "Alluvial Loam",
    villageOrStreet: initialData?.address?.villageOrStreet || "Swarna Paddy Belt, P.O. Galsi",
    cityOrTown: initialData?.address?.cityOrTown || "Bardhaman",
    district: initialData?.address?.district || "Purba Bardhaman",
    state: initialData?.address?.state || "West Bengal",
    pincode: initialData?.address?.pincode || "713406",
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: formData.name,
        sector: formData.sector,
        totalAreaAcres: Number(formData.totalAreaAcres),
        waterSourceType: formData.waterSourceType,
        soilType: formData.soilType,
        villageOrStreet: formData.villageOrStreet,
        cityOrTown: formData.cityOrTown,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
      };

      const url = initialData?.id
        ? `/api/farmer/farms/${initialData.id}`
        : "/api/farmer/farms";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save farm");
      }

      onClose();
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? "Edit Farm Land / Pond" : "Register New Farm Land / Pond"}
      description="Record acreage, water supply, and geographic location for production verification."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-body text-left">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Farm / Pond Name" required>
            <Input
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Swarna Agro Farm North"
              required
            />
          </FormField>

          <FormField label="Sector Type" required>
            <Select
              value={formData.sector}
              onChange={(e) => updateField("sector", e.target.value)}
              options={[
                { value: "AGRICULTURE", label: "Agriculture (Crops)" },
                { value: "AQUACULTURE", label: "Aquaculture (Ponds & Fish)" },
              ]}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Total Area (Acres)" required>
            <Input
              type="number"
              step="0.01"
              min="0.1"
              value={formData.totalAreaAcres}
              onChange={(e) => updateField("totalAreaAcres", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Water Source">
            <Input
              value={formData.waterSourceType}
              onChange={(e) => updateField("waterSourceType", e.target.value)}
              placeholder="e.g. River Canal / Deep Tube Well"
            />
          </FormField>

          <FormField label="Soil / Pond Type">
            <Input
              value={formData.soilType}
              onChange={(e) => updateField("soilType", e.target.value)}
              placeholder="e.g. Clay Loam / Freshwater Pond"
            />
          </FormField>
        </div>

        <div className="space-y-3 pt-2 border-t border-surface-dim">
          <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-neutral">
            Farm Location & Address
          </h4>

          <FormField label="Village / Street" required>
            <Input
              value={formData.villageOrStreet}
              onChange={(e) => updateField("villageOrStreet", e.target.value)}
              placeholder="Street or Village"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="City / Town" required>
              <Input
                value={formData.cityOrTown}
                onChange={(e) => updateField("cityOrTown", e.target.value)}
                placeholder="City/Town"
                required
              />
            </FormField>

            <FormField label="District" required>
              <Input
                value={formData.district}
                onChange={(e) => updateField("district", e.target.value)}
                placeholder="District"
                required
              />
            </FormField>

            <FormField label="State" required>
              <Input
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="State"
                required
              />
            </FormField>
          </div>

          <FormField label="Pincode" required>
            <Input
              value={formData.pincode}
              onChange={(e) => updateField("pincode", e.target.value)}
              placeholder="6-digit Indian PIN"
              required
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-dim">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            {initialData?.id ? "Update Farm" : "Save Farm"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
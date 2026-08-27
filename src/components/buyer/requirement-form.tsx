"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { Sprout, Waves, IndianRupee, Package } from "lucide-react";

export interface RequirementFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: string;
    title?: string;
    sector?: "AGRICULTURE" | "AQUACULTURE";
    category?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    targetPricePerUnit?: number | null;
    locationDistrict?: string;
    locationState?: string;
    deliveryExpectation?: string | null;
  };
}

export function RequirementForm({
  isOpen,
  onClose,
  initialData,
}: RequirementFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    sector: initialData?.sector || "AGRICULTURE",
    category: initialData?.category || "Cereals & Grains",
    description: initialData?.description || "",
    quantity: initialData?.quantity ? String(initialData.quantity) : "100",
    unit: initialData?.unit || "QUINTAL",
    targetPricePerUnit: initialData?.targetPricePerUnit
      ? String(initialData.targetPricePerUnit)
      : "",
    locationDistrict: initialData?.locationDistrict || "Kolkata",
    locationState: initialData?.locationState || "West Bengal",
    deliveryExpectation: initialData?.deliveryExpectation || "Within 14 Days",
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
        title: formData.title,
        sector: formData.sector,
        category: formData.category,
        description: formData.description,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        targetPricePerUnit: formData.targetPricePerUnit
          ? Number(formData.targetPricePerUnit)
          : null,
        locationDistrict: formData.locationDistrict,
        locationState: formData.locationState,
        deliveryExpectation: formData.deliveryExpectation || null,
      };

      const url = initialData?.id
        ? `/api/buyer/requirements/${initialData.id}`
        : "/api/buyer/requirements";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save requirement");
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
      title={initialData?.id ? "Edit Procurement Requirement" : "Post Procurement Requirement"}
      description="Publish your bulk agricultural crop or aquaculture volume requirements to connect with verified producers."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-body text-left">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-heading font-semibold text-on-surface">
            Sector <span className="text-status-error">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateField("sector", "AGRICULTURE")}
              className={`flex items-center justify-center gap-2 p-2.5 rounded border text-xs font-heading font-semibold transition-all ${
                formData.sector === "AGRICULTURE"
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm"
                  : "border-surface-dim bg-white text-slate-neutral hover:bg-surface-low"
              }`}
            >
              <Sprout className="h-4 w-4" />
              <span>Agriculture</span>
            </button>

            <button
              type="button"
              onClick={() => updateField("sector", "AQUACULTURE")}
              className={`flex items-center justify-center gap-2 p-2.5 rounded border text-xs font-heading font-semibold transition-all ${
                formData.sector === "AQUACULTURE"
                  ? "border-brand-secondary bg-brand-secondary/10 text-brand-secondary shadow-sm"
                  : "border-surface-dim bg-white text-slate-neutral hover:bg-surface-low"
              }`}
            >
              <Waves className="h-4 w-4" />
              <span>Aquaculture</span>
            </button>
          </div>
        </div>

        <FormField label="Requirement Title" required hint="e.g. Need 500 Quintals Swarna Paddy for Processing Mill">
          <Input
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Enter concise requirement title"
            required
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Category" required>
            <Select
              value={formData.category}
              onChange={(e) => updateField("category", e.target.value)}
              options={
                formData.sector === "AGRICULTURE"
                  ? [
                      { value: "Cereals & Grains", label: "Cereals & Grains" },
                      { value: "Root Vegetables", label: "Root Vegetables" },
                      { value: "Pulses & Legumes", label: "Pulses & Legumes" },
                      { value: "Oilseeds", label: "Oilseeds" },
                      { value: "Fruits & Vegetables", label: "Fruits & Vegetables" },
                    ]
                  : [
                      { value: "Freshwater Fish", label: "Freshwater Fish (Rohu/Catla)" },
                      { value: "Fish Seed & Hatchery", label: "Fish Seed & Fingerlings" },
                      { value: "Shrimp & Prawns", label: "Shrimp & Prawns" },
                      { value: "Aqua Feed", label: "Aquaculture Feed" },
                    ]
              }
            />
          </FormField>

          <FormField label="Delivery Expectation" hint="e.g. Immediate / Next 14 Days">
            <Input
              value={formData.deliveryExpectation}
              onChange={(e) => updateField("deliveryExpectation", e.target.value)}
              placeholder="e.g. Within 10-15 days"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="Required Volume" required>
            <Input
              type="number"
              min="1"
              step="any"
              leftIcon={<Package className="h-4 w-4" />}
              value={formData.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Unit" required>
            <Select
              value={formData.unit}
              onChange={(e) => updateField("unit", e.target.value)}
              options={[
                { value: "QUINTAL", label: "Quintal (100 kg)" },
                { value: "TON", label: "Metric Ton (1,000 kg)" },
                { value: "KG", label: "Kilogram (kg)" },
                { value: "BAG", label: "Bag (50 kg)" },
                { value: "PIECE", label: "Piece / Seed" },
              ]}
            />
          </FormField>

          <FormField label="Target Rate / Unit (₹)" hint="Optional target ceiling">
            <Input
              type="number"
              min="1"
              step="any"
              leftIcon={<IndianRupee className="h-4 w-4" />}
              value={formData.targetPricePerUnit}
              onChange={(e) => updateField("targetPricePerUnit", e.target.value)}
              placeholder="e.g. 2150"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Delivery District" required>
            <Input
              value={formData.locationDistrict}
              onChange={(e) => updateField("locationDistrict", e.target.value)}
              placeholder="e.g. Kolkata / Bardhaman"
              required
            />
          </FormField>

          <FormField label="Delivery State" required>
            <Input
              value={formData.locationState}
              onChange={(e) => updateField("locationState", e.target.value)}
              placeholder="e.g. West Bengal"
              required
            />
          </FormField>
        </div>

        <FormField label="Specification & Quality Requirements" required hint="Moisture tolerance, packaging preference, and payment terms.">
          <Textarea
            rows={3}
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe quality grade, moisture max %, delivery terms..."
            required
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-dim">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            {initialData?.id ? "Update Requirement" : "Publish Requirement"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
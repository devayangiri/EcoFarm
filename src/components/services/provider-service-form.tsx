"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export interface ProviderServiceFormProps {
  initialService?: {
    id?: string;
    title?: string;
    description?: string;
    category?: string;
    sector?: string;
    pricingModel?: string;
    basePrice?: number;
    coverImageUrl?: string | null;
    serviceArea?: string | null;
    locationDistrict?: string;
    locationState?: string;
  };
  isEdit?: boolean;
}

export function ProviderServiceForm({ initialService, isEdit = false }: ProviderServiceFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: initialService?.title || "",
    description: initialService?.description || "",
    category: initialService?.category || "MACHINERY_RENTAL",
    sector: initialService?.sector || "AGRICULTURE",
    pricingModel: initialService?.pricingModel || "PER_ACRE",
    basePrice: initialService?.basePrice ? String(initialService.basePrice) : "",
    coverImageUrl: initialService?.coverImageUrl || "",
    serviceArea: initialService?.serviceArea || "Within 50km radius",
    locationDistrict: initialService?.locationDistrict || "",
    locationState: initialService?.locationState || "West Bengal",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const url = isEdit
        ? `/api/provider/services/${initialService?.id}`
        : "/api/provider/services";

      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          basePrice: Number(formData.basePrice),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save service");
      }

      router.push("/provider/services");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-surface-dim bg-white shadow-sm font-body text-left max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-base font-bold">
          {isEdit ? "Edit Service Solution" : "Create New Commercial Service Listing"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Service Title" required hint="e.g. 50HP John Deere Tractor with Rotary Tiller">
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Category" required>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { label: "Machinery Rental", value: "MACHINERY_RENTAL" },
                  { label: "Warehouse Storage", value: "STORAGE" },
                  { label: "Cold Storage", value: "COLD_STORAGE" },
                  { label: "Logistics Fleet", value: "LOGISTICS" },
                  { label: "Farm Transport", value: "TRANSPORT" },
                  { label: "Soil Testing Labs", value: "SOIL_TESTING" },
                  { label: "Water Quality Testing", value: "WATER_TESTING" },
                  { label: "Farm Labor Crew", value: "LABOR" },
                  { label: "Aquaculture Support", value: "AQUACULTURE_SERVICE" },
                  { label: "Agronomy Consulting", value: "CONSULTING" },
                ]}
              />
            </FormField>

            <FormField label="Sector" required>
              <Select
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                options={[
                  { label: "Agriculture", value: "AGRICULTURE" },
                  { label: "Aquaculture", value: "AQUACULTURE" },
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Pricing Model" required>
              <Select
                value={formData.pricingModel}
                onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value })}
                options={[
                  { label: "Per Hour", value: "HOURLY" },
                  { label: "Per Day", value: "DAILY" },
                  { label: "Per Acre", value: "PER_ACRE" },
                  { label: "Per Tonne", value: "PER_TON" },
                  { label: "Fixed Rate", value: "FIXED" },
                ]}
              />
            </FormField>

            <FormField label="Base Rate (₹ INR)" required>
              <Input
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
              />
            </FormField>
          </div>

          <FormField label="Service Description" required>
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe machine specifications, crew experience, storage humidity controls..."
              required
            />
          </FormField>

          <FormField label="Service Coverage Radius / Area" hint="e.g. Within 50km of Bardhaman or Statewide">
            <Input
              value={formData.serviceArea}
              onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Base District" required>
              <Input
                value={formData.locationDistrict}
                onChange={(e) => setFormData({ ...formData, locationDistrict: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Base State" required>
              <Input
                value={formData.locationState}
                onChange={(e) => setFormData({ ...formData, locationState: e.target.value })}
                required
              />
            </FormField>
          </div>

          <FormField label="Cover Image URL (Optional)">
            <Input
              value={formData.coverImageUrl}
              onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
              placeholder="https://..."
            />
          </FormField>

          <div className="flex justify-end pt-4 border-t border-surface-dim">
            <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
              {isEdit ? "Update Service" : "Publish Service"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

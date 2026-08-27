"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sprout,
  Waves,
  ArrowRight,
  ArrowLeft,
  Check,
  UploadCloud,
  X,
  IndianRupee,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export interface ProductFormProps {
  initialData?: {
    id?: string;
    title?: string;
    description?: string;
    sector?: "AGRICULTURE" | "AQUACULTURE";
    category?: string;
    variety?: string | null;
    pricePerUnit?: number;
    unit?: string;
    minimumOrderQuantity?: number;
    availableStock?: number;
    harvestDate?: string | null;
    locationDistrict?: string;
    locationState?: string;
    images?: Array<{ url: string; altText?: string; isPrimary?: boolean }>;
    status?: string;
  };
  isEditing?: boolean;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    sector: initialData?.sector || "AGRICULTURE",
    category: initialData?.category || "Cereals & Grains",
    variety: initialData?.variety || "",
    pricePerUnit: initialData?.pricePerUnit ? String(initialData.pricePerUnit) : "",
    unit: initialData?.unit || "QUINTAL",
    minimumOrderQuantity: initialData?.minimumOrderQuantity ? String(initialData.minimumOrderQuantity) : "1",
    availableStock: initialData?.availableStock ? String(initialData.availableStock) : "",
    harvestDate: initialData?.harvestDate ? initialData.harvestDate.slice(0, 10) : "",
    locationDistrict: initialData?.locationDistrict || "Purba Bardhaman",
    locationState: initialData?.locationState || "West Bengal",
    images: initialData?.images || [
      {
        url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
        altText: "Produce Image",
        isPrimary: true,
      },
    ],
  });

  const [imageUrlInput, setImageUrlInput] = useState("");

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          url: imageUrlInput.trim(),
          altText: formData.title || "Product photo",
          isPrimary: prev.images.length === 0,
        },
      ],
    }));
    setImageUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const validateStep1 = () => {
    if (formData.title.trim().length < 3) {
      setErrorMessage("Product title must be at least 3 characters");
      return false;
    }
    if (formData.description.trim().length < 10) {
      setErrorMessage("Product description must be at least 10 characters");
      return false;
    }
    if (!formData.category.trim()) {
      setErrorMessage("Please select or enter a category");
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep2 = () => {
    const price = Number(formData.pricePerUnit);
    const stock = Number(formData.availableStock);
    const moq = Number(formData.minimumOrderQuantity);

    if (isNaN(price) || price <= 0) {
      setErrorMessage("Price must be a valid positive number");
      return false;
    }
    if (isNaN(stock) || stock < 0) {
      setErrorMessage("Available stock cannot be negative");
      return false;
    }
    if (isNaN(moq) || moq < 1) {
      setErrorMessage("Minimum order quantity must be at least 1");
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleSubmit = async (submitForModeration: boolean) => {
    if (!validateStep1() || !validateStep2()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        sector: formData.sector,
        category: formData.category,
        variety: formData.variety || null,
        pricePerUnit: Number(formData.pricePerUnit),
        unit: formData.unit,
        minimumOrderQuantity: Number(formData.minimumOrderQuantity),
        availableStock: Number(formData.availableStock),
        harvestDate: formData.harvestDate ? new Date(formData.harvestDate).toISOString() : null,
        locationDistrict: formData.locationDistrict,
        locationState: formData.locationState,
        images: formData.images,
        submitForModeration,
      };

      const url = isEditing
        ? `/api/farmer/products/${initialData?.id}`
        : "/api/farmer/products";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save product");
      }

      router.push("/farmer/products");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-body">
      <div className="flex items-center justify-between border-b border-surface-dim pb-4">
        {[
          { num: 1, title: "Basic Information" },
          { num: 2, title: "Pricing & Stock" },
          { num: 3, title: "Images & Location" },
        ].map((s) => (
          <div
            key={s.num}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              if (s.num === 1) setStep(1);
              if (s.num === 2 && validateStep1()) setStep(2);
              if (s.num === 3 && validateStep1() && validateStep2()) setStep(3);
            }}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step === s.num
                  ? "bg-brand-primary text-white"
                  : step > s.num
                  ? "bg-status-success text-white"
                  : "bg-surface-low text-slate-neutral border border-surface-dim"
              }`}
            >
              {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
            </div>
            <span
              className={`text-xs font-heading font-semibold hidden sm:inline ${
                step === s.num ? "text-on-surface font-bold" : "text-slate-neutral"
              }`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {step === 1 && (
        <Card className="border border-surface-dim bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 1: Basic Commodity Information</CardTitle>
            <CardDescription className="text-xs">
              Specify your harvest, crop variety, and general categorization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-on-surface">
                Primary Sector <span className="text-status-error">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField("sector", "AGRICULTURE")}
                  className={`flex items-center justify-center gap-2 p-3 rounded border text-xs font-heading font-semibold transition-all ${
                    formData.sector === "AGRICULTURE"
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm"
                      : "border-surface-dim bg-white text-slate-neutral hover:bg-surface-low"
                  }`}
                >
                  <Sprout className="h-4 w-4" />
                  <span>Agriculture (Crops)</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField("sector", "AQUACULTURE")}
                  className={`flex items-center justify-center gap-2 p-3 rounded border text-xs font-heading font-semibold transition-all ${
                    formData.sector === "AQUACULTURE"
                      ? "border-brand-secondary bg-brand-secondary/10 text-brand-secondary shadow-sm"
                      : "border-surface-dim bg-white text-slate-neutral hover:bg-surface-low"
                  }`}
                >
                  <Waves className="h-4 w-4" />
                  <span>Aquaculture (Fish & Shrimp)</span>
                </button>
              </div>
            </div>

            <FormField label="Product Title" required hint="e.g. Swarna High-Yield Paddy Grain (Grade A)">
              <Input
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Enter descriptive commodity title"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Commodity Category" required>
                <Select
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  options={
                    formData.sector === "AGRICULTURE"
                      ? [
                          { value: "Cereals & Grains", label: "Cereals & Grains (Paddy, Wheat, Corn)" },
                          { value: "Root Vegetables", label: "Root Vegetables (Potato, Onion)" },
                          { value: "Pulses & Legumes", label: "Pulses & Legumes (Lentils, Chickpea)" },
                          { value: "Oilseeds", label: "Oilseeds (Mustard, Sesame)" },
                          { value: "Fruits & Vegetables", label: "Fresh Fruits & Vegetables" },
                          { value: "Seeds & Fertilizers", label: "Agricultural Inputs & Seeds" },
                        ]
                      : [
                          { value: "Freshwater Fish", label: "Live Freshwater Fish (Rohu, Catla, Mrigal)" },
                          { value: "Fish Seed & Hatchery", label: "Fingerlings & Fish Seed (Spawn, Fry)" },
                          { value: "Shrimp & Prawns", label: "Shrimp & Prawns (Vannamei, Tiger)" },
                          { value: "Aqua Feed & Supplements", label: "Aquaculture Feed & Supplements" },
                        ]
                  }
                />
              </FormField>

              <FormField label="Variety / Breed" hint="e.g. Swarna MTU 7029, Kufri Jyoti, Labeo rohita">
                <Input
                  value={formData.variety}
                  onChange={(e) => updateField("variety", e.target.value)}
                  placeholder="Enter specific variety or breed"
                />
              </FormField>
            </div>

            <FormField label="Detailed Description" required hint="Describe quality grade, moisture content, packaging, and cultivation practices.">
              <Textarea
                rows={4}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Provide comprehensive details about this harvest batch..."
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Next: Pricing & Stock
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border border-surface-dim bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 2: Pricing, Units & Available Stock</CardTitle>
            <CardDescription className="text-xs">
              Configure wholesale unit rates and inventory volumes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Wholesale Price per Unit (₹)" required>
                <Input
                  type="number"
                  min="1"
                  step="any"
                  leftIcon={<IndianRupee className="h-4 w-4" />}
                  value={formData.pricePerUnit}
                  onChange={(e) => updateField("pricePerUnit", e.target.value)}
                  placeholder="e.g. 2180"
                />
              </FormField>

              <FormField label="Unit of Measurement" required>
                <Select
                  value={formData.unit}
                  onChange={(e) => updateField("unit", e.target.value)}
                  options={[
                    { value: "QUINTAL", label: "Quintal (100 kg)" },
                    { value: "KG", label: "Kilogram (kg)" },
                    { value: "TON", label: "Metric Ton (1,000 kg)" },
                    { value: "BAG", label: "Bag / Sack (50 kg)" },
                    { value: "PIECE", label: "Piece (Live Seed / Fish)" },
                    { value: "CRATE", label: "Crate (25 kg)" },
                  ]}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Available Stock Quantity" required>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  leftIcon={<Package className="h-4 w-4" />}
                  value={formData.availableStock}
                  onChange={(e) => updateField("availableStock", e.target.value)}
                  placeholder="e.g. 500"
                />
              </FormField>

              <FormField label="Minimum Order Quantity (MOQ)" required hint="Minimum volume a buyer must order">
                <Input
                  type="number"
                  min="1"
                  step="any"
                  value={formData.minimumOrderQuantity}
                  onChange={(e) => updateField("minimumOrderQuantity", e.target.value)}
                  placeholder="e.g. 10"
                />
              </FormField>
            </div>

            <FormField label="Harvest / Batch Date" hint="Date of harvest or fish catch">
              <Input
                type="date"
                value={formData.harvestDate}
                onChange={(e) => updateField("harvestDate", e.target.value)}
              />
            </FormField>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back: Basic Info
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Next: Images & Location
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border border-surface-dim bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 3: Photos & Farm Location</CardTitle>
            <CardDescription className="text-xs">
              Upload photos of your harvest and confirm dispatch location.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-heading font-semibold text-on-surface">
                Commodity Photos (Max 8 images)
              </label>

              <div className="flex gap-2">
                <Input
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste direct image URL (https://...)"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddImage}
                  leftIcon={<UploadCloud className="h-4 w-4" />}
                >
                  Add
                </Button>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group rounded border border-surface-dim overflow-hidden aspect-video bg-surface-low">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.altText || "Produce"} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {img.isPrimary && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-brand-primary text-white text-[9px] font-bold rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-surface-dim pt-4">
              <FormField label="District Location" required>
                <Input
                  value={formData.locationDistrict}
                  onChange={(e) => updateField("locationDistrict", e.target.value)}
                  placeholder="e.g. Purba Bardhaman"
                />
              </FormField>

              <FormField label="State Location" required>
                <Input
                  value={formData.locationState}
                  onChange={(e) => updateField("locationState", e.target.value)}
                  placeholder="e.g. West Bengal"
                />
              </FormField>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-surface-dim">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                disabled={isLoading}
              >
                Back: Pricing & Stock
              </Button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  isLoading={isLoading}
                >
                  Save as Draft
                </Button>

                <Button
                  variant="primary"
                  onClick={() => handleSubmit(true)}
                  isLoading={isLoading}
                >
                  Submit for Moderation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
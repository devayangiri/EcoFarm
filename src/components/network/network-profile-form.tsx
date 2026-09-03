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

export interface NetworkProfileFormProps {
  initialProfile: {
    displayName: string;
    headline?: string | null;
    bio?: string | null;
    participantType?: string | null;
    businessCategory?: string | null;
    sector?: string | null;
    district?: string | null;
    state?: string | null;
    avatarUrl?: string | null;
    websiteUrl?: string | null;
    isBusiness?: boolean;
    businessRegNumber?: string | null;
  };
}

export function NetworkProfileForm({ initialProfile }: NetworkProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: initialProfile.displayName || "",
    headline: initialProfile.headline || "",
    bio: initialProfile.bio || "",
    participantType: initialProfile.participantType || "FARMER",
    businessCategory: initialProfile.businessCategory || "",
    sector: initialProfile.sector || "AGRICULTURE",
    district: initialProfile.district || "",
    state: initialProfile.state || "",
    avatarUrl: initialProfile.avatarUrl || "",
    websiteUrl: initialProfile.websiteUrl || "",
    isBusiness: initialProfile.isBusiness || false,
    businessRegNumber: initialProfile.businessRegNumber || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/network/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update network profile");
      }

      setSuccessMessage("Network business identity updated successfully!");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-surface-dim bg-white shadow-sm font-body text-left max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-base font-bold">Public B2B Network Identity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <FormField label="Entity / Display Name" required>
            <Input
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Professional Headline" hint="Short summary shown in directory cards">
            <Input
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder="e.g. Certified Organic Paddy Producer & Seed Multiplier"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Participant Classification">
              <Select
                value={formData.participantType}
                onChange={(e) => setFormData({ ...formData, participantType: e.target.value })}
                options={[
                  { label: "Farmer / Producer", value: "FARMER" },
                  { label: "Commercial Buyer / Trader", value: "BUYER" },
                  { label: "Service Provider / Logistics", value: "SERVICE_PROVIDER" },
                  { label: "EcoFarm Enterprise", value: "BUSINESS" },
                  { label: "Cooperative / FPO", value: "ORGANIZATION" },
                ]}
              />
            </FormField>

            <FormField label="Sector">
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

          <FormField label="Business Category" hint="e.g. Cereals, Freshwater Carp, Cold Storage, Hatchery Feed">
            <Input
              value={formData.businessCategory}
              onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="District">
              <Input
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </FormField>

            <FormField label="State">
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="About & Business Bio">
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder="Describe your agricultural capacity, warehousing, trade volume, or services..."
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Logo / Avatar Image URL">
              <Input
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="https://..."
              />
            </FormField>

            <FormField label="Company Website URL">
              <Input
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://..."
              />
            </FormField>
          </div>

          <div className="flex justify-end pt-4 border-t border-surface-dim">
            <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
              Save Network Identity
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

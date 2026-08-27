"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export interface ProfileFormProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    role: string;
    status: string;
    farmerProfile?: {
      id: string;
      experienceYears?: number | null;
      avatarUrl?: string | null;
      isVerified: boolean;
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

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    experienceYears: user.farmerProfile?.experienceYears ? String(user.farmerProfile.experienceYears) : "12",
    avatarUrl: user.farmerProfile?.avatarUrl || "",
    villageOrStreet: user.farmerProfile?.address?.villageOrStreet || "Swarna Paddy Belt, P.O. Galsi",
    cityOrTown: user.farmerProfile?.address?.cityOrTown || "Bardhaman",
    district: user.farmerProfile?.address?.district || "Purba Bardhaman",
    state: user.farmerProfile?.address?.state || "West Bengal",
    pincode: user.farmerProfile?.address?.pincode || "713406",
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
        experienceYears: Number(formData.experienceYears),
        avatarUrl: formData.avatarUrl || null,
        villageOrStreet: formData.villageOrStreet,
        cityOrTown: formData.cityOrTown,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
      };

      const res = await fetch("/api/farmer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update profile");
      }

      setSuccessMessage("Farmer profile updated successfully");
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
            <CardTitle className="text-base font-bold">Account Identity</CardTitle>
            <Badge variant="success">{user.status}</Badge>
          </div>
          <CardDescription className="text-xs">
            Security and role designations are managed by the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required>
              <Input
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
              />
            </FormField>

            <FormField label="Primary Contact Phone">
              <Input
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+919876543210"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email Address (Read-Only)">
              <Input value={user.email} disabled className="bg-surface-low" />
            </FormField>

            <FormField label="Farming Experience (Years)">
              <Input
                type="number"
                min="0"
                max="70"
                value={formData.experienceYears}
                onChange={(e) => updateField("experienceYears", e.target.value)}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-surface-dim bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Registered Profile Address</CardTitle>
          <CardDescription className="text-xs">
            Your primary operational location for trade settlements and field agent visits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Village / Street / Landmark" required>
            <Input
              value={formData.villageOrStreet}
              onChange={(e) => updateField("villageOrStreet", e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="City / Town" required>
              <Input
                value={formData.cityOrTown}
                onChange={(e) => updateField("cityOrTown", e.target.value)}
                required
              />
            </FormField>

            <FormField label="District" required>
              <Input
                value={formData.district}
                onChange={(e) => updateField("district", e.target.value)}
                required
              />
            </FormField>

            <FormField label="State" required>
              <Input
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
                required
              />
            </FormField>
          </div>

          <FormField label="PIN Code" required>
            <Input
              value={formData.pincode}
              onChange={(e) => updateField("pincode", e.target.value)}
              placeholder="713406"
              required
            />
          </FormField>

          <div className="flex justify-end pt-2">
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Save Profile Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
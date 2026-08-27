"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Send, ShieldCheck, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface ServiceRequestFormProps {
  service: {
    id: string;
    title: string;
    category: string;
    pricingModel: string;
    basePrice: number;
    provider: {
      businessName: string;
      isVerified: boolean;
      location: string;
    };
  };
}

export function ServiceRequestForm({ service }: ServiceRequestFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    serviceId: service.id,
    requiredDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    quantityOrScale: "",
    requirements: "",
    locationVillageOrStreet: "",
    locationCityOrTown: "",
    locationDistrict: "",
    locationState: "West Bengal",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/services/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to submit service request");
      }

      router.push(`/buyer/services/${json.data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-body text-left max-w-4xl mx-auto">
      {/* Left: Request Form */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-5">
          <div className="border-b border-surface-dim pb-3">
            <h2 className="font-heading text-lg font-bold text-on-surface">Submit Service Scope & Request</h2>
            <p className="text-xs text-slate-neutral mt-0.5">
              The service provider will review your technical specifications and transmit a formal quotation.
            </p>
          </div>

          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Required Service Date" required>
                <Input
                  type="date"
                  value={formData.requiredDate}
                  onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Operational Scale / Quantity" required hint="e.g. 25 Acres, 40 MT, 3 Days">
                <Input
                  value={formData.quantityOrScale}
                  onChange={(e) => setFormData({ ...formData, quantityOrScale: e.target.value })}
                  placeholder="e.g. 50 Acres Harvester Service"
                  required
                />
              </FormField>
            </div>

            <FormField label="Scope & Technical Requirements" required hint="Describe soil condition, crop type, access roads, specific machinery needs">
              <Textarea
                rows={4}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Specify requirements e.g. We require combine harvester for Swarna paddy harvesting across 50 contiguous acres with road transport access..."
                required
              />
            </FormField>

            <div className="space-y-3 pt-2 border-t border-surface-dim">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-neutral block">
                Work Execution Destination
              </span>

              <FormField label="Village / Street / Plot Landmark">
                <Input
                  value={formData.locationVillageOrStreet}
                  onChange={(e) => setFormData({ ...formData, locationVillageOrStreet: e.target.value })}
                  placeholder="e.g. Plot 14, Near Gopinathpur Canal"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="City / Town" required>
                  <Input
                    value={formData.locationCityOrTown}
                    onChange={(e) => setFormData({ ...formData, locationCityOrTown: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="District" required>
                  <Input
                    value={formData.locationDistrict}
                    onChange={(e) => setFormData({ ...formData, locationDistrict: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="State" required>
                  <Input
                    value={formData.locationState}
                    onChange={(e) => setFormData({ ...formData, locationState: e.target.value })}
                    required
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Additional Notes (Optional)">
              <Textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any timing constraints, fuel provision, or driver accommodation details..."
              />
            </FormField>

            <div className="flex justify-end pt-4 border-t border-surface-dim">
              <Button type="submit" variant="primary" size="md" isLoading={isLoading} rightIcon={<Send className="h-4 w-4" />}>
                Submit Request for Quotation
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Right: Service Summary Card */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4 text-xs">
          <h3 className="font-heading font-bold text-sm text-on-surface border-b border-surface-dim pb-2">
            Service Listing
          </h3>

          <div className="space-y-2">
            <strong className="font-heading text-sm text-on-surface block">{service.title}</strong>
            <div className="flex items-center gap-1.5 text-slate-neutral">
              <span>{service.provider.businessName}</span>
              {service.provider.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-status-success" />}
            </div>
            <span className="flex items-center gap-1 text-slate-neutral">
              <MapPin className="h-3 w-3" />
              {service.provider.location}
            </span>
          </div>

          <div className="p-3 bg-surface-low rounded border border-surface-dim space-y-1">
            <span className="text-[11px] text-slate-neutral block">Reference Base Price:</span>
            <span className="font-mono text-base font-extrabold text-brand-primary">
              {formatCurrency(service.basePrice)} <span className="text-xs font-normal text-slate-neutral">({service.pricingModel})</span>
            </span>
            <p className="text-[10px] text-slate-neutral leading-normal mt-1">
              Final binding amount will be defined by the provider in the formal quotation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

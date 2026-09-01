import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ServiceService } from "@/services/service.service";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  ChevronLeft,
  Wrench,
  CheckCircle,
} from "lucide-react";

import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface ServiceDetailPageProps {
  params: { id: string };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  let service;
  let isDbError = false;

  try {
    service = await ServiceService.getServiceDetails(params.id);
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 404) {
      notFound();
    }
    isDbError = true;
    console.error("[ServiceDetailPage] Error fetching service:", {
      route: `/services/${params.id}`,
      errorCategory: "DATABASE_UNAVAILABLE",
      message: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }

  if (isDbError || !service) {
    return (
      <MarketplaceShell>
        <div className="py-12 max-w-stitch-container mx-auto px-4 text-center">
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-8 max-w-md mx-auto space-y-4">
            <h2 className="font-heading text-lg font-bold text-amber-900">
              Service Listing Temporarily Unavailable
            </h2>
            <p className="text-xs text-amber-700 leading-relaxed">
              We are currently unable to connect to the services database to retrieve this listing. Our team has been notified.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <a
                href="/services"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                Back to Services
              </a>
            </div>
          </div>
        </div>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6 text-left font-body">
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-slate-neutral hover:text-brand-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Services Ecosystem</span>
        </Link>

        {/* Main Details Banner Card */}
        <Card className="border border-surface-dim bg-white shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={service.sector === "AQUACULTURE" ? "secondary" : "primary"} size="sm">
                  {service.category.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline" size="sm">
                  {service.sector}
                </Badge>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">
                {service.title}
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-neutral">
                <span className="font-semibold text-on-surface">{service.provider.businessName}</span>
                {service.provider.isVerified && (
                  <ShieldCheck className="h-4 w-4 text-status-success" />
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {service.provider.location}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 space-y-2">
              <div>
                <span className="text-xs text-slate-neutral block uppercase tracking-wider font-semibold">Reference Rate</span>
                <span className="font-mono text-2xl font-extrabold text-brand-primary block">
                  {formatCurrency(service.basePrice)}
                  <span className="text-sm font-normal text-slate-neutral"> ({service.pricingModel})</span>
                </span>
              </div>

              <Link href={`/services/request/${service.id}`}>
                <Button variant="primary" size="md" className="w-full gap-1.5">
                  <span>Request Binding Quotation</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-3">
              <h2 className="font-heading text-base font-bold text-on-surface">Service Scope & Deliverables</h2>
              <p className="text-sm text-slate-neutral leading-relaxed whitespace-pre-wrap">
                {service.description}
              </p>
            </Card>

            <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-3">
              <h2 className="font-heading text-base font-bold text-on-surface">Coverage Radius & Availability</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-surface-low rounded border border-surface-dim space-y-0.5">
                  <span className="text-slate-neutral block">Service Operating Radius:</span>
                  <strong className="text-on-surface font-semibold">{service.serviceArea}</strong>
                </div>
                <div className="p-3 bg-surface-low rounded border border-surface-dim space-y-0.5">
                  <span className="text-slate-neutral block">Base District & State:</span>
                  <strong className="text-on-surface font-semibold">{service.locationDistrict}, {service.locationState}</strong>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4 text-xs">
              <h3 className="font-heading font-bold text-sm text-on-surface border-b border-surface-dim pb-2">
                Service Provider Credentials
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-surface-dim">
                  <span className="text-slate-neutral">Enterprise Name:</span>
                  <span className="font-bold text-on-surface">{service.provider.businessName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-surface-dim">
                  <span className="text-slate-neutral">Experience:</span>
                  <span className="font-bold text-on-surface">{service.provider.experienceYears} Years</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-neutral">Verification Status:</span>
                  <span className="font-bold text-status-success">
                    {service.provider.isVerified ? "Verified Commercial Provider" : "Registered Partner"}
                  </span>
                </div>
              </div>

              <Link href={`/services/request/${service.id}`}>
                <Button variant="primary" size="md" className="w-full mt-2">
                  Request Quotation
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </MarketplaceShell>
  );
}

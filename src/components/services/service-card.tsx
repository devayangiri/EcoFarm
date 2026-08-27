"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  MapPin,
  Tag,
  Clock,
  ArrowRight,
  Wrench,
} from "lucide-react";

export interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  sector: string;
  pricingModel: string;
  basePrice: number;
  coverImageUrl?: string | null;
  serviceArea?: string | null;
  locationDistrict: string;
  locationState: string;
  provider: {
    id: string;
    userId: string;
    businessName: string;
    isVerified: boolean;
  };
}

export function ServiceCard({
  id,
  title,
  description,
  category,
  sector,
  pricingModel,
  basePrice,
  coverImageUrl,
  serviceArea,
  locationDistrict,
  locationState,
  provider,
}: ServiceCardProps) {
  const formatPricingModel = (model: string) => {
    switch (model) {
      case "HOURLY": return "/ Hour";
      case "DAILY": return "/ Day";
      case "PER_ACRE": return "/ Acre";
      case "PER_TON": return "/ Tonne";
      case "FIXED": return " Fixed Rate";
      default: return "";
    }
  };

  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Card className="group overflow-hidden rounded-lg border border-surface-dim bg-white transition-all hover:shadow-md hover:border-brand-secondary/30 flex flex-col justify-between text-left font-body">
      {/* Cover Image or Fallback Header */}
      <div className="relative h-44 w-full bg-surface-low overflow-hidden border-b border-surface-dim flex items-center justify-center">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-neutral gap-2">
            <Wrench className="h-10 w-10 text-brand-secondary/50" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{formatCategory(category)}</span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={sector === "AQUACULTURE" ? "secondary" : "primary"} size="sm">
            {formatCategory(category)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Provider Identity */}
          <div className="flex items-center gap-1.5 text-xs text-slate-neutral">
            <span className="font-semibold text-on-surface truncate">{provider.businessName}</span>
            {provider.isVerified && (
              <ShieldCheck className="h-3.5 w-3.5 text-status-success shrink-0" />
            )}
          </div>

          {/* Title */}
          <Link href={`/services/${id}`} className="block">
            <h3 className="font-heading font-bold text-base text-on-surface group-hover:text-brand-primary transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-xs text-slate-neutral line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Location & Coverage */}
          <div className="flex items-center justify-between text-[11px] text-slate-neutral border-t border-surface-dim pt-2">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{locationDistrict}, {locationState}</span>
            </span>
            <span className="text-[10px] font-semibold text-brand-secondary bg-brand-secondary/10 px-2 py-0.5 rounded">
              {serviceArea || "Regional"}
            </span>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-1 border-t border-surface-low">
            <div>
              <span className="text-[10px] text-slate-neutral block uppercase tracking-wider font-semibold">Starting From</span>
              <span className="font-mono text-base font-extrabold text-brand-primary">
                {formatCurrency(basePrice)}
                <span className="text-xs font-normal text-slate-neutral">{formatPricingModel(pricingModel)}</span>
              </span>
            </div>

            <Link href={`/services/request/${id}`}>
              <Button variant="primary" size="sm" className="gap-1 shadow-xs">
                <span>Request Quote</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

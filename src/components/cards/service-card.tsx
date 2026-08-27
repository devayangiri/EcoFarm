import React from "react";
import { Wrench, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export interface ServiceCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  pricingModel: string;
  basePrice: number;
  providerName: string;
  locationDistrict?: string;
  locationState?: string;
  coverImageUrl?: string | null;
  onBookQuote?: (serviceId: string) => void;
}

export function ServiceCard({
  id,
  title,
  category,
  description,
  pricingModel,
  basePrice,
  providerName,
  locationDistrict,
  locationState,
  coverImageUrl,
  onBookQuote,
}: ServiceCardProps) {
  return (
    <Card className="overflow-hidden rounded-lg border border-surface-dim bg-white transition-all hover:shadow-md hover:border-brand-secondary/30 flex flex-col justify-between">
      <div>
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-low">
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-container text-brand-secondary">
              <Wrench className="h-8 w-8" />
            </div>
          )}
          <div className="absolute top-2.5 left-2.5">
            <Badge variant="secondary" size="sm">
              {category.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-2">
          <h3 className="font-heading text-sm font-bold text-on-surface line-clamp-1">
            {title}
          </h3>
          <p className="text-xs text-slate-neutral font-body line-clamp-2 leading-relaxed">
            {description}
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-neutral pt-2 border-t border-surface-dim">
            <span className="font-semibold text-on-surface">{providerName}</span>
            {locationDistrict && (
              <div className="flex items-center gap-1 text-slate-neutral/80">
                <MapPin className="h-3 w-3" />
                <span>{locationDistrict}, {locationState}</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-surface-low mt-2">
        <div>
          <span className="text-[10px] text-slate-neutral uppercase font-heading font-semibold block">
            Starting Rate
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-sm font-bold text-brand-primary">
              {formatCurrency(basePrice)}
            </span>
            <span className="text-[11px] text-slate-neutral">/{pricingModel.replace("PER_", "").toLowerCase()}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onBookQuote?.(id)}
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
        >
          Request Quote
        </Button>
      </div>
    </Card>
  );
}

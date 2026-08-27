"use client";

import React from "react";
import Link from "next/link";
import { MapPin, ShieldCheck, ShoppingCart, Sprout, Fish } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  sector: "AGRICULTURE" | "AQUACULTURE";
  category: string;
  variety?: string | null;
  pricePerUnit: number;
  unit: string;
  availableStock: number;
  sellerName: string;
  isSellerVerified?: boolean;
  locationDistrict: string;
  locationState: string;
  imageUrl?: string | null;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({
  id,
  slug,
  title,
  sector,
  category,
  variety,
  pricePerUnit,
  unit,
  availableStock,
  sellerName,
  isSellerVerified = true,
  locationDistrict,
  locationState,
  imageUrl,
  onAddToCart,
}: ProductCardProps) {
  const isOutOfStock = availableStock <= 0;

  return (
    <Card className="group overflow-hidden rounded-lg border border-surface-dim bg-white transition-all hover:shadow-md hover:border-brand-secondary/30 flex flex-col justify-between">
      <div>
        {/* Image & Sector Badge */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-low">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-container text-slate-neutral/40">
              {sector === "AGRICULTURE" ? <Sprout className="h-10 w-10" /> : <Fish className="h-10 w-10" />}
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <Badge variant={sector === "AGRICULTURE" ? "primary" : "secondary"} size="sm">
              {sector === "AGRICULTURE" ? (
                <>
                  <Sprout className="h-3 w-3" />
                  <span>Agri</span>
                </>
              ) : (
                <>
                  <Fish className="h-3 w-3" />
                  <span>Aqua</span>
                </>
              )}
            </Badge>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-on-surface/60 backdrop-blur-xs">
              <Badge variant="error" size="md">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Content Body */}
        <CardContent className="p-4 space-y-2.5">
          <div className="space-y-1">
            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-brand-secondary">
              {category}
            </span>
            <Link href={`/marketplace/${slug}`} className="block">
              <h3 className="font-heading text-sm font-bold text-on-surface line-clamp-1 group-hover:text-brand-primary transition-colors">
                {title}
              </h3>
            </Link>
            {variety && (
              <p className="text-xs text-slate-neutral line-clamp-1">
                Variety: <span className="font-medium text-on-surface">{variety}</span>
              </p>
            )}
          </div>

          {/* Seller & Location */}
          <div className="flex items-center justify-between text-[11px] text-slate-neutral pt-1 border-t border-surface-dim">
            <div className="flex items-center gap-1 truncate max-w-[140px]">
              <span className="truncate">{sellerName}</span>
              {isSellerVerified && <ShieldCheck className="h-3 w-3 text-status-success shrink-0" />}
            </div>

            <div className="flex items-center gap-1 shrink-0 text-slate-neutral/80">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{locationDistrict}, {locationState}</span>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Footer Pricing & CTA */}
      <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-surface-low mt-2">
        <div>
          <span className="text-[10px] text-slate-neutral uppercase font-heading font-semibold block">
            Wholesale Price
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-base font-bold text-brand-primary">
              {formatCurrency(pricePerUnit)}
            </span>
            <span className="text-xs text-slate-neutral">/{unit}</span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={isOutOfStock}
          onClick={() => onAddToCart?.(id)}
          leftIcon={<ShoppingCart className="h-3.5 w-3.5" />}
          className="gap-1.5"
        >
          Buy / Inquire
        </Button>
      </div>
    </Card>
  );
}

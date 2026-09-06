"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ShieldCheck, Sprout, Waves, Bookmark, ShoppingCart, Check, AlertCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getProductFallbackImage } from "@/config/image-assets";

export interface ProductCardProps {
  id: string;
  slug?: string;
  title: string;
  sector: "AGRICULTURE" | "AQUACULTURE";
  category: string;
  variety?: string | null;
  pricePerUnit: number;
  unit: string;
  availableStock: number;
  moq?: number | null;
  grade?: string | null;
  sellerName: string;
  isSellerVerified?: boolean;
  locationDistrict: string;
  locationState: string;
  imageUrl?: string | null;
  isSaved?: boolean;
  isInCart?: boolean;
  isBuyerPortal?: boolean;
  userRole?: string | null;
  onToggleSave?: (productId: string) => void;
  onAddToCart?: (productId: string) => Promise<void> | void;
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
  moq,
  grade,
  sellerName,
  isSellerVerified = true,
  locationDistrict,
  locationState,
  imageUrl,
  isSaved = false,
  isInCart = false,
  isBuyerPortal = false,
  userRole,
  onToggleSave,
  onAddToCart,
}: ProductCardProps) {
  const router = useRouter();
  const [inCart, setInCart] = useState(isInCart);
  const [isAdding, setIsAdding] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    setInCart(isInCart);
  }, [isInCart]);

  const isOutOfStock = availableStock <= 0;
  const targetIdentifier = slug || id;
  const fallback = getProductFallbackImage(sector, category);
  const displayImage = imageUrl || fallback.src;
  const isFallback = !imageUrl;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCardError(null);

    // Unauthenticated Guest -> redirect to login
    if (!userRole && !isBuyerPortal) {
      router.push(`/login?callbackUrl=/marketplace/${targetIdentifier}`);
      return;
    }

    // Role check: Non-buyer role attempting to buy
    if (userRole && userRole !== "BUYER" && !isBuyerPortal) {
      setCardError("Only registered commercial buyers can place wholesale orders");
      return;
    }

    if (inCart) return;

    if (isOutOfStock) {
      setCardError("Commodity lot is currently out of stock");
      return;
    }

    if (onAddToCart) {
      setIsAdding(true);
      try {
        await onAddToCart(id);
        setInCart(true);
      } catch (err: any) {
        console.error("[ProductCard] Add to cart error:", err);
        setCardError(err.message || "Failed to add commodity lot to cart");
      } finally {
        setIsAdding(false);
      }
    } else {
      router.push(`/marketplace/${targetIdentifier}`);
    }
  };

  return (
    <Card className="group overflow-hidden rounded-xl border border-surface-dim bg-white transition-all hover:shadow-lg hover:border-brand-primary/30 flex flex-col justify-between">
      <div>
        {/* Image & Sector Badge */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-low">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt={imageUrl ? title : fallback.alt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Sample representation indicator if fallback image is used */}
          {isFallback && (
            <div className="absolute bottom-2 left-2 z-10">
              <span className="bg-black/60 backdrop-blur-xs text-white/90 text-[9px] px-2 py-0.5 rounded font-mono font-medium shadow-xs">
                Sample visual
              </span>
            </div>
          )}

          {/* Top Badges & Save Button */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
            <Badge variant={sector === "AGRICULTURE" ? "primary" : "secondary"} size="sm">
              {sector === "AGRICULTURE" ? (
                <>
                  <Sprout className="h-3 w-3" />
                  <span>Agri</span>
                </>
              ) : (
                <>
                  <Waves className="h-3 w-3" />
                  <span>Aqua</span>
                </>
              )}
            </Badge>

            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSave(id);
                }}
                className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md transition-all ${
                  isSaved
                    ? "bg-brand-primary text-white shadow-sm"
                    : "bg-white/80 text-slate-neutral hover:bg-white hover:text-on-surface shadow-xs"
                }`}
                aria-label={isSaved ? "Unsave product" : "Save product"}
              >
                <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
              </button>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-on-surface/60 backdrop-blur-xs z-20">
              <Badge variant="error" size="md">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Content Body */}
        <CardContent className="p-4 space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-heading font-semibold uppercase tracking-wider text-brand-secondary">
                {category}
              </span>
              <span className="text-slate-neutral/70 text-[10px]">No reviews yet</span>
            </div>

            <Link href={`/marketplace/${targetIdentifier}`} className="block">
              <h3 className="font-heading text-sm sm:text-base font-bold text-on-surface line-clamp-1 group-hover:text-brand-primary transition-colors">
                {title}
              </h3>
            </Link>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-neutral">
              {variety && (
                <span>Variety: <strong className="text-on-surface font-medium">{variety}</strong></span>
              )}
              {grade && (
                <span>Grade: <strong className="text-on-surface font-medium">{grade}</strong></span>
              )}
              {moq && (
                <span>MOQ: <strong className="text-on-surface font-medium">{moq} {unit}</strong></span>
              )}
            </div>
          </div>

          {/* Seller & Location */}
          <div className="flex items-center justify-between text-[11px] text-slate-neutral pt-2 border-t border-surface-dim">
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
      <div className="p-4 pt-0 flex flex-col gap-2.5 border-t border-surface-low mt-2">
        <div className="flex items-baseline justify-between pt-2">
          <div>
            <span className="text-[10px] text-slate-neutral uppercase font-heading font-semibold block">
              Wholesale Price
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-base sm:text-lg font-bold text-brand-primary">
                {formatCurrency(pricePerUnit)}
              </span>
              <span className="text-xs text-slate-neutral">/{unit}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-neutral uppercase font-heading font-semibold block">
              Available
            </span>
            <span className="text-xs font-mono font-bold text-on-surface">
              {availableStock} {unit}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Link href={`/marketplace/${targetIdentifier}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold gap-1"
            >
              Details
            </Button>
          </Link>

          {(isBuyerPortal || userRole === "BUYER") ? (
            inCart ? (
              <div className="flex items-center gap-1.5 flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="flex-1 text-[11px] h-8 px-2 bg-brand-primary/5 text-brand-primary border-brand-primary/20 cursor-default font-semibold"
                >
                  <Check className="h-3 w-3 mr-1 text-status-success shrink-0" />
                  <span className="truncate">In Cart</span>
                </Button>
                <Link href="/buyer/cart">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[11px] h-8 px-2.5 font-semibold shrink-0"
                    title="Go to Cart"
                  >
                    Cart →
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddToCart}
                isLoading={isAdding}
                disabled={isOutOfStock || isAdding}
                className="flex-1 text-[11px] h-8 px-2 gap-1 font-semibold"
              >
                <ShoppingCart className="h-3 w-3" />
                <span className="truncate">{isAdding ? "Adding..." : "Add to Cart"}</span>
              </Button>
            )
          ) : !userRole ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 text-[11px] h-8 px-2 gap-1 font-semibold"
            >
              <ShoppingCart className="h-3 w-3" />
              <span className="truncate">Add to Cart</span>
            </Button>
          ) : null}
        </div>

        {cardError && (
          <div className="mt-1.5 p-1.5 rounded bg-status-error/10 border border-status-error/20 text-[10px] text-status-error flex items-start gap-1 animate-fadeIn">
            <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="leading-tight flex-1">{cardError}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCardError(null);
              }}
              className="text-status-error/70 hover:text-status-error ml-0.5"
              aria-label="Dismiss error"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
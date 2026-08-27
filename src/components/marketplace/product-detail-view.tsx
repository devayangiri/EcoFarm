"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { InquiryDialog } from "@/components/marketplace/inquiry-dialog";
import { formatCurrency } from "@/lib/utils";
import {
  Sprout,
  Waves,
  ShieldCheck,
  Bookmark,
  MessageSquare,
  ChevronLeft,
  ShoppingCart,
  Check,
  Plus,
  Minus,
} from "lucide-react";

export interface ProductDetailViewProps {
  product: {
    id: string;
    slug: string;
    title: string;
    description: string;
    sector: "AGRICULTURE" | "AQUACULTURE";
    category: string;
    variety: string | null;
    pricePerUnit: number;
    unit: string;
    minimumOrderQuantity: number;
    availableStock: number;
    reservedStock: number;
    harvestDate: Date | null;
    locationDistrict: string;
    locationState: string;
    status: string;
    createdAt: Date;
    images: Array<{ id: string; url: string; altText: string | null; isPrimary: boolean }>;
    seller: {
      id: string;
      fullName: string;
      memberSince: Date;
      isVerified: boolean;
      experienceYears: number | null;
      avatarUrl: string | null;
      district: string;
      state: string;
      activeListingsCount: number;
      farms: Array<{ id: string; name: string; totalAreaAcres: number; sector: string }>;
    };
    isSaved: boolean;
  };
  currentUserRole?: string | null;
}

export function ProductDetailView({ product, currentUserRole }: ProductDetailViewProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(product.isSaved);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [quantity, setQuantity] = useState(product.minimumOrderQuantity);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const images = product.images.length > 0
    ? product.images
    : [{ id: "placeholder", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600", altText: "Produce", isPrimary: true }];

  const handleToggleSave = async () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      if (nextSaved) {
        await fetch("/api/buyer/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
      } else {
        await fetch(`/api/buyer/saved/${product.id}`, { method: "DELETE" });
      }
    } catch {
      setIsSaved(!nextSaved);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUserRole) {
      router.push(`/login?callbackUrl=/marketplace/${product.id}`);
      return;
    }

    if (currentUserRole !== "BUYER") {
      setCartError("Only registered commercial buyers can place wholesale orders");
      return;
    }

    setIsAddingToCart(true);
    setCartError(null);

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add to cart");
      }

      setCartSuccess(true);
    } catch (err: any) {
      setCartError(err.message || "An error occurred");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-slate-neutral hover:text-brand-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Marketplace</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant={isSaved ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleSave}
            leftIcon={<Bookmark className={`h-4 w-4 ${isSaved ? "fill-brand-primary" : ""}`} />}
          >
            {isSaved ? "Saved" : "Save Lot"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInquiryOpen(true)}
            leftIcon={<MessageSquare className="h-4 w-4" />}
          >
            Send Inquiry
          </Button>
        </div>
      </div>

      {cartError && (
        <Alert variant="error" onDismiss={() => setCartError(null)}>
          {cartError}
        </Alert>
      )}

      {cartSuccess && (
        <Alert variant="success" onDismiss={() => setCartSuccess(false)}>
          Commodity lot added to your procurement cart.{" "}
          <Link href="/cart" className="underline font-bold">
            View Cart & Checkout
          </Link>
        </Alert>
      )}

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Gallery & Description */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Large Image */}
          <div className="aspect-video w-full rounded-xl border border-surface-dim overflow-hidden bg-surface-low relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[selectedImageIndex]?.url}
              alt={images[selectedImageIndex]?.altText || product.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <Badge variant={product.sector === "AGRICULTURE" ? "primary" : "secondary"}>
                {product.sector === "AGRICULTURE" ? (
                  <>
                    <Sprout className="h-3 w-3" />
                    <span>Agriculture</span>
                  </>
                ) : (
                  <>
                    <Waves className="h-3 w-3" />
                    <span>Aquaculture</span>
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative h-16 w-24 rounded border overflow-hidden shrink-0 transition-all ${
                    selectedImageIndex === idx
                      ? "border-brand-primary ring-2 ring-brand-primary/20"
                      : "border-surface-dim opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Commodity Details & Specs */}
          <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-neutral mb-1">
                <span>{product.category}</span>
                {product.variety && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-on-surface">Variety: {product.variety}</span>
                  </>
                )}
              </div>
              <h1 className="font-heading text-2xl font-extrabold text-on-surface">{product.title}</h1>
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-neutral">
                Commodity Overview & Quality Grade
              </h2>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-dim text-xs">
              <div>
                <span className="text-slate-neutral block">Dispatch Location:</span>
                <span className="font-bold text-on-surface">{product.locationDistrict}, {product.locationState}</span>
              </div>

              <div>
                <span className="text-slate-neutral block">Harvest / Batch Date:</span>
                <span className="font-bold text-on-surface">
                  {product.harvestDate ? new Date(product.harvestDate).toLocaleDateString() : "Fresh Current Season"}
                </span>
              </div>

              <div>
                <span className="text-slate-neutral block">Minimum Order:</span>
                <span className="font-bold text-on-surface">{product.minimumOrderQuantity} {product.unit}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Pricing, Stock & Producer Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pricing & Stock Card */}
          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-5">
            <div className="p-4 bg-surface-low rounded-lg border border-surface-dim space-y-1">
              <span className="text-[11px] font-heading font-semibold uppercase text-slate-neutral block">
                Wholesale Price
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-3xl font-extrabold text-brand-primary">
                  {formatCurrency(product.pricePerUnit)}
                </span>
                <span className="text-xs text-slate-neutral">/{product.unit}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-surface-dim">
                <span className="text-slate-neutral">Available Lot Stock:</span>
                <span className="font-mono font-bold text-on-surface">
                  {product.availableStock} {product.unit}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-surface-dim">
                <span className="text-slate-neutral">Minimum Order (MOQ):</span>
                <span className="font-mono font-bold text-on-surface">
                  {product.minimumOrderQuantity} {product.unit}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-neutral">Stock Status:</span>
                <Badge variant={product.availableStock > 0 ? "success" : "error"} size="sm">
                  {product.availableStock > 0 ? "In Stock & Ready for Dispatch" : "Out of Stock"}
                </Badge>
              </div>
            </div>

            {/* Quantity Selector & Add to Cart */}
            {product.availableStock > 0 && (
              <div className="space-y-3 pt-2 border-t border-surface-dim">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-neutral">Order Quantity:</span>
                  <div className="flex items-center border border-surface-dim rounded-md bg-surface-low">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(product.minimumOrderQuantity, q - 1))}
                      disabled={quantity <= product.minimumOrderQuantity}
                      className="p-1.5 text-slate-neutral hover:text-on-surface disabled:opacity-30"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 font-mono text-xs font-bold text-on-surface min-w-[40px] text-center">
                      {quantity} {product.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.availableStock, q + 1))}
                      disabled={quantity >= product.availableStock}
                      className="p-1.5 text-slate-neutral hover:text-on-surface disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleAddToCart}
                  isLoading={isAddingToCart}
                  leftIcon={cartSuccess ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                >
                  {cartSuccess ? "Added to Cart" : "Add Lot to Cart"}
                </Button>
              </div>
            )}
          </Card>

          {/* Verified Producer Public Card */}
          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-heading font-bold text-lg shrink-0">
                {product.seller.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-sm text-on-surface truncate">
                    {product.seller.fullName}
                  </h3>
                  {product.seller.isVerified && (
                    <ShieldCheck className="h-4 w-4 text-status-success shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-neutral">
                  {product.seller.district}, {product.seller.state}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-surface-dim text-xs">
              {product.seller.experienceYears !== null && (
                <div className="flex items-center justify-between py-1 border-b border-surface-dim">
                  <span className="text-slate-neutral">Farming Experience:</span>
                  <span className="font-bold text-on-surface">{product.seller.experienceYears} Years</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-surface-dim">
                <span className="text-slate-neutral">Active Marketplace Lots:</span>
                <span className="font-bold text-on-surface">{product.seller.activeListingsCount} Commodities</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-neutral">Producer Verification:</span>
                <span className="font-bold text-status-success">Direct Verified Farmer</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Inquiry Dialog */}
      <InquiryDialog
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        productId={product.id}
        productTitle={product.title}
        sellerName={product.seller.fullName}
      />
    </div>
  );
}
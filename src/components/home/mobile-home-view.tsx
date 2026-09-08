"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Store,
  Sprout,
  Waves,
  Package,
  Wrench,
  ChevronRight,
  ShieldCheck,
  MapPin,
  ShoppingCart,
  Check,
  SlidersHorizontal,
  ArrowRight,
  Fish,
  Wheat,
  Apple,
  Truck,
  Sparkles,
} from "lucide-react";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { formatCurrency } from "@/lib/utils";
import { getProductFallbackImage } from "@/config/image-assets";

interface MobileHomeViewProps {
  featuredProducts: any[];
  genuineServices: any[];
  genuineProfiles: any[];
  userRole?: string | null;
  userName?: string | null;
}

const CATEGORIES = [
  { label: "All", href: "/marketplace", icon: Store },
  { label: "Fresh Fish", href: "/marketplace?category=Freshwater+Fish", icon: Fish },
  { label: "Shrimp", href: "/marketplace?category=Shrimp+%26+Prawn", icon: Waves },
  { label: "Paddy & Rice", href: "/marketplace?category=Paddy+%26+Rice", icon: Wheat },
  { label: "Vegetables", href: "/marketplace?category=Vegetables", icon: Sprout },
  { label: "Fruits", href: "/marketplace?category=Fruits", icon: Apple },
  { label: "Services", href: "/services", icon: Wrench },
  { label: "Transport", href: "/services?category=Logistics", icon: Truck },
];

export function MobileHomeView({
  featuredProducts = [],
  genuineServices = [],
  genuineProfiles = [],
  userRole,
  userName,
}: MobileHomeViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart, isAdding } = useAddToCart();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/marketplace");
    }
  };

  const handleProductAddToCart = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart(product.id, {
        slug: product.slug,
        userRole,
        isBuyerPortal: userRole?.toUpperCase() === "BUYER",
      });
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 2500);
    } catch {
      // Handled in hook / redirected
    }
  };

  const isFarmer = userRole?.toUpperCase() === "FARMER";

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-24 font-body">
      {/* 1. TOP APP SEARCH BAR */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-surface-dim px-4 py-2.5 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-neutral/70 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crops, freshwater fish, seeds, services..."
            className="w-full h-10 pl-10 pr-10 rounded-xl bg-surface-low/80 border border-surface-dim text-xs text-on-surface placeholder:text-slate-neutral/60 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-slate-neutral/60 hover:text-slate-neutral text-xs"
            >
              Clear
            </button>
          ) : (
            <Link
              href="/marketplace"
              className="absolute right-2.5 p-1 text-slate-neutral/70 hover:text-brand-primary"
              aria-label="Filter"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Link>
          )}
        </form>
      </div>

      {/* 2. PWA INSTALL PROMPT (WHEN INSTALLABLE) */}
      <PwaInstallBanner />

      {/* 3. QUICK ACTIONS GRID (4 NATIVE COMMERCE TILES) */}
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-4 gap-2 text-center">
          <Link
            href="/marketplace"
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white border border-surface-dim/70 shadow-xs active:scale-95 transition-transform"
          >
            <div className="h-11 w-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-on-surface">Shop</span>
          </Link>

          <Link
            href={isFarmer ? "/farmer/products" : "/register?role=FARMER"}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white border border-surface-dim/70 shadow-xs active:scale-95 transition-transform"
          >
            <div className="h-11 w-11 rounded-xl bg-status-success/15 text-emerald-700 flex items-center justify-center shadow-xs">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-on-surface">Sell</span>
          </Link>

          <Link
            href={isFarmer ? "/farmer/orders" : "/buyer/orders"}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white border border-surface-dim/70 shadow-xs active:scale-95 transition-transform"
          >
            <div className="h-11 w-11 rounded-xl bg-brand-secondary/15 text-brand-secondary flex items-center justify-center shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-on-surface">Orders</span>
          </Link>

          <Link
            href="/services"
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white border border-surface-dim/70 shadow-xs active:scale-95 transition-transform"
          >
            <div className="h-11 w-11 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shadow-xs">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-on-surface">Services</span>
          </Link>
        </div>
      </div>

      {/* 4. HORIZONTAL CATEGORY CAROUSEL */}
      <div className="pt-2 pb-3">
        <div className="flex items-center justify-between px-4 mb-2">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-neutral">
            Popular Categories
          </h3>
          <Link
            href="/marketplace"
            className="text-[11px] font-semibold text-brand-primary flex items-center gap-0.5"
          >
            <span>All</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full bg-white border border-surface-dim shadow-xs text-xs font-medium text-on-surface active:bg-surface-low transition-colors"
              >
                <Icon className="h-3.5 w-3.5 text-brand-primary" />
                <span>{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4.5. ECOFARM AI ASSISTANT BANNER */}
      <div className="px-4 py-1.5">
        <Link
          href="/ai"
          className="block rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 p-3.5 text-white shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-emerald-200 animate-pulse" />
                  EcoFarm AI
                </span>
                <span className="text-[10px] text-emerald-100/90 font-medium">Free 24/7 Advisory</span>
              </div>
              <h3 className="font-heading font-bold text-sm text-white leading-tight">
                Ask anything about crops, fish & market rates
              </h3>
              <p className="text-[11px] text-emerald-100/90 leading-snug">
                Instant guidance on pest control, water quality, pricing & logistics.
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* 5. FEATURED WHOLESALE LOTS (2-COLUMN COMPACT COMMERCE GRID) */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
            <h2 className="font-heading font-bold text-base text-on-surface">
              Featured Wholesale Lots
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="text-xs font-semibold text-brand-primary hover:text-brand-secondary flex items-center gap-0.5"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {featuredProducts.map((p) => {
              const fallback = getProductFallbackImage(p.sector, p.category);
              const displayImage = p.imageUrl || fallback.src;
              const isAdded = addedIds[p.id];
              const isOutOfStock = p.availableStock <= 0;

              return (
                <div
                  key={p.id}
                  className="group flex flex-col justify-between rounded-2xl border border-surface-dim bg-white overflow-hidden shadow-xs hover:shadow-sm transition-all"
                >
                  <Link
                    href={`/marketplace/${p.slug || p.id}`}
                    className="block relative aspect-square w-full overflow-hidden bg-surface-low"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImage}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />

                    {/* Sector Tag */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white shadow-xs ${
                          p.sector === "AGRICULTURE" ? "bg-brand-primary/90" : "bg-brand-secondary/90"
                        }`}
                      >
                        {p.sector === "AGRICULTURE" ? "Agri" : "Aqua"}
                      </span>
                    </div>

                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="p-2.5 flex flex-col justify-between flex-1">
                    <Link href={`/marketplace/${p.slug || p.id}`} className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-secondary line-clamp-1">
                        {p.category}
                      </span>
                      <h3 className="font-heading font-bold text-xs text-on-surface line-clamp-2 mt-0.5 leading-snug">
                        {p.title}
                      </h3>

                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="font-heading font-black text-sm text-brand-primary">
                          {formatCurrency(p.pricePerUnit)}
                        </span>
                        <span className="text-[10px] text-slate-neutral">/{p.unit}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-neutral mt-1">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{p.locationDistrict || "Local"}</span>
                      </div>
                    </Link>

                    <div className="mt-2.5 pt-2 border-t border-surface-low">
                      <button
                        type="button"
                        onClick={(e) => handleProductAddToCart(p, e)}
                        disabled={isOutOfStock || isAdding}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          isAdded
                            ? "bg-status-success text-white"
                            : isOutOfStock
                            ? "bg-surface-low text-slate-neutral/60 cursor-not-allowed"
                            : "bg-brand-primary text-white active:bg-brand-primary-dark"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3 w-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-surface-dim bg-white p-6 text-center">
            <Sprout className="h-8 w-8 text-brand-primary/40 mx-auto mb-2" />
            <p className="text-xs font-semibold text-on-surface">No active lots available</p>
            <p className="text-[11px] text-slate-neutral mt-0.5">
              Check back soon as farmers list fresh harvests.
            </p>
          </div>
        )}
      </div>

      {/* 6. FRESH HARVESTS & CLUSTERS */}
      <div className="px-4 py-2">
        <div className="rounded-2xl bg-gradient-to-br from-brand-primary/10 via-brand-secondary/10 to-emerald-500/10 border border-brand-primary/15 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <h3 className="font-heading font-bold text-sm text-brand-primary">
              Fresh Harvests Near You
            </h3>
          </div>
          <p className="text-xs text-slate-neutral leading-relaxed">
            Direct wholesale sourcing from verified farm clusters across West Bengal, Odisha, and Andhra Pradesh.
          </p>
          <div className="pt-1 flex flex-wrap gap-1.5">
            {["Hooghly", "North 24 Pgs", "East Midnapore", "Nadia", "Burdwan"].map((district) => (
              <Link
                key={district}
                href={`/marketplace?district=${encodeURIComponent(district)}`}
                className="px-2.5 py-1 rounded-lg bg-white/90 border border-brand-primary/20 text-[11px] font-semibold text-brand-primary hover:bg-white shadow-xs"
              >
                {district}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 7. SERVICES & MACHINERY */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Wrench className="h-4 w-4 text-brand-secondary" />
            <h2 className="font-heading font-bold text-base text-on-surface">
              Machinery & Cold Storage
            </h2>
          </div>
          <Link
            href="/services"
            className="text-xs font-semibold text-brand-secondary hover:text-brand-primary flex items-center gap-0.5"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {genuineServices.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {genuineServices.map((s) => (
              <Link
                key={s.id}
                href={`/services/${s.id}`}
                className="shrink-0 w-64 rounded-2xl border border-surface-dim bg-white p-3 shadow-xs active:bg-surface-low transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-secondary">
                    {s.category}
                  </span>
                  <span className="text-xs font-bold text-brand-primary">
                    {formatCurrency(s.basePrice || 0)}
                  </span>
                </div>
                <h4 className="font-heading font-bold text-xs text-on-surface line-clamp-1 mt-1">
                  {s.title}
                </h4>
                <p className="text-[11px] text-slate-neutral line-clamp-2 mt-1 leading-relaxed">
                  {s.description}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-neutral mt-2 pt-2 border-t border-surface-low">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{s.locationDistrict || "Local Area"}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white border border-surface-dim text-center">
            <p className="text-xs text-slate-neutral">
              Tractor rental, testing labs, and cold storage options available in Directory.
            </p>
            <Link
              href="/services"
              className="inline-block mt-2 text-xs font-bold text-brand-primary underline"
            >
              Browse Services
            </Link>
          </div>
        )}
      </div>

      {/* 8. COMMERCE VALUE STRIP */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-surface-dim/70 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-primary shrink-0" />
            <span className="font-medium text-slate-neutral text-[11px]">100% Verified Sellers</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-surface-dim/70 flex items-center gap-2">
            <Store className="h-4 w-4 text-brand-secondary shrink-0" />
            <span className="font-medium text-slate-neutral text-[11px]">Direct Farm-Gate Price</span>
          </div>
        </div>
      </div>
    </div>
  );
}

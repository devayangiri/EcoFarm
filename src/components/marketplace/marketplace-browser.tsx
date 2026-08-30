"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/cards/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Dialog } from "@/components/ui/dialog";
import {
  Search,
  SlidersHorizontal,
  Sprout,
  Waves,
  LayoutGrid,
  X,
} from "lucide-react";

export interface MarketplaceBrowserProps {
  initialProducts: Array<{
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
    locationDistrict: string;
    locationState: string;
    imageUrl?: string;
    seller: {
      id: string;
      fullName: string;
      isVerified: boolean;
      experienceYears: number | null;
    };
    isSaved?: boolean;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  currentSector: "ALL" | "AGRICULTURE" | "AQUACULTURE";
  facets?: {
    categories: Array<{ category: string; sector: string }>;
    states: string[];
  };
  isBuyerPortal?: boolean;
}

export function MarketplaceBrowser({
  initialProducts,
  pagination,
  currentSector,
  facets,
  isBuyerPortal = false,
}: MarketplaceBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [savedStatusMap, setSavedStatusMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialProducts.forEach((p) => {
      if (p.isSaved) map[p.id] = true;
    });
    return map;
  });

  const updateQueryParams = (newParams: Record<string, string | undefined>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });

    // Reset page to 1 on filter changes unless page itself is specified
    if (!newParams.page) {
      current.delete("page");
    }

    const basePath = isBuyerPortal ? "/buyer/marketplace" : "/marketplace";
    const path = currentSector === "AGRICULTURE" && isBuyerPortal
      ? "/buyer/marketplace/agriculture"
      : currentSector === "AQUACULTURE" && isBuyerPortal
      ? "/buyer/marketplace/aquaculture"
      : basePath;

    router.push(`${path}?${current.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({ search: searchQuery.trim() || undefined });
  };

  const handleSectorChange = (sector: "ALL" | "AGRICULTURE" | "AQUACULTURE") => {
    if (isBuyerPortal) {
      if (sector === "AGRICULTURE") router.push("/buyer/marketplace/agriculture");
      else if (sector === "AQUACULTURE") router.push("/buyer/marketplace/aquaculture");
      else router.push("/buyer/marketplace");
    } else {
      updateQueryParams({ sector: sector === "ALL" ? undefined : sector });
    }
  };

  const handleToggleSave = async (productId: string) => {
    const isCurrentlySaved = !!savedStatusMap[productId];
    // Optimistic toggle
    setSavedStatusMap((prev) => ({ ...prev, [productId]: !isCurrentlySaved }));

    try {
      if (isCurrentlySaved) {
        await fetch(`/api/buyer/saved/${productId}`, { method: "DELETE" });
      } else {
        await fetch("/api/buyer/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
      }
    } catch {
      // Revert on failure
      setSavedStatusMap((prev) => ({ ...prev, [productId]: isCurrentlySaved }));
    }
  };

  const activeCategory = searchParams.get("category") || "";
  const activeSort = searchParams.get("sortBy") || "newest";
  const activeInStockOnly = searchParams.get("inStockOnly") === "true";

  return (
    <div className="space-y-6 font-body">
      {/* Sector Navigation Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3 rounded-lg border border-surface-dim shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-surface-low rounded-md border border-surface-dim">
          <button
            type="button"
            onClick={() => handleSectorChange("ALL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-bold transition-all ${
              currentSector === "ALL"
                ? "bg-white text-on-surface shadow-xs border border-surface-dim"
                : "text-slate-neutral hover:text-on-surface"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>All Sectors</span>
          </button>

          <button
            type="button"
            onClick={() => handleSectorChange("AGRICULTURE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-bold transition-all ${
              currentSector === "AGRICULTURE"
                ? "bg-brand-primary text-white shadow-xs"
                : "text-slate-neutral hover:text-brand-primary"
            }`}
          >
            <Sprout className="h-3.5 w-3.5" />
            <span>Agriculture Produce</span>
          </button>

          <button
            type="button"
            onClick={() => handleSectorChange("AQUACULTURE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-bold transition-all ${
              currentSector === "AQUACULTURE"
                ? "bg-brand-secondary text-white shadow-xs"
                : "text-slate-neutral hover:text-brand-secondary"
            }`}
          >
            <Waves className="h-3.5 w-3.5" />
            <span>Aquaculture & Fish</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-neutral hidden sm:inline">Sort:</span>
          <Select
            value={activeSort}
            onChange={(e) => updateQueryParams({ sortBy: e.target.value })}
            options={[
              { value: "newest", label: "Newest Harvests" },
              { value: "price_asc", label: "Price: Low to High" },
              { value: "price_desc", label: "Price: High to Low" },
              { value: "stock_desc", label: "Highest Available Stock" },
              { value: "title", label: "Commodity Name (A-Z)" },
            ]}
          />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by commodity (Paddy, Rohu Fish, Wheat, Potato, Seeds)..."
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => setIsFilterModalOpen(true)}
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          >
            Filters
            {(activeCategory || activeInStockOnly || searchParams.get("minPrice") || searchParams.get("maxPrice")) && (
              <Badge variant="primary" size="sm" className="ml-1.5">
                Active
              </Badge>
            )}
          </Button>

          {(searchParams.get("search") || activeCategory || activeInStockOnly || searchParams.get("minPrice")) && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setSearchQuery("");
                router.push(isBuyerPortal ? "/buyer/marketplace" : "/marketplace");
              }}
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Product Results Grid */}
      {initialProducts.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {initialProducts.map((prod) => (
              <div key={prod.id} className="relative group">
                <ProductCard
                  id={prod.id}
                  slug={prod.slug}
                  title={prod.title}
                  sector={prod.sector}
                  category={prod.category}
                  variety={prod.variety}
                  pricePerUnit={prod.pricePerUnit}
                  unit={prod.unit}
                  availableStock={prod.availableStock}
                  sellerName={prod.seller.fullName}
                  isSellerVerified={prod.seller.isVerified}
                  locationDistrict={prod.locationDistrict}
                  locationState={prod.locationState}
                  imageUrl={prod.imageUrl}
                  isSaved={savedStatusMap[prod.id]}
                  onToggleSave={() => handleToggleSave(prod.id)}
                />
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pt-4 border-t border-surface-dim">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.pageSize}
                onPageChange={(p) => updateQueryParams({ page: String(p) })}
              />
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="No Products Found"
          description="Try adjusting your search keywords, clearing price limits, or browsing across all sectors."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            router.push(isBuyerPortal ? "/buyer/marketplace" : "/marketplace");
          }}
        />
      )}

      {/* Filter Modal Dialog */}
      <Dialog
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Wholesale Marketplace"
        description="Narrow down available lots by volume, price, district, and stock availability."
        maxWidth="md"
      >
        <div className="space-y-4 font-body text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-semibold text-on-surface">Category</label>
            <Select
              value={activeCategory}
              onChange={(e) => updateQueryParams({ category: e.target.value || undefined })}
              options={[
                { value: "", label: "All Commodity Categories" },
                ...(facets?.categories?.map((c) => ({
                  value: c.category,
                  label: `${c.category} (${c.sector === "AGRICULTURE" ? "Agri" : "Aqua"})`,
                })) || []),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-heading font-semibold text-on-surface">Min Price (₹)</label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                defaultValue={searchParams.get("minPrice") || ""}
                onBlur={(e) => updateQueryParams({ minPrice: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-heading font-semibold text-on-surface">Max Price (₹)</label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                defaultValue={searchParams.get("maxPrice") || ""}
                onBlur={(e) => updateQueryParams({ maxPrice: e.target.value || undefined })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-semibold text-on-surface">State Location</label>
            <Select
              value={searchParams.get("state") || ""}
              onChange={(e) => updateQueryParams({ state: e.target.value || undefined })}
              options={[
                { value: "", label: "All States" },
                ...(facets?.states?.map((s) => ({ value: s, label: s })) || [
                  { value: "West Bengal", label: "West Bengal" },
                  { value: "Odisha", label: "Odisha" },
                  { value: "Bihar", label: "Bihar" },
                  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
                ]),
              ]}
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-surface-dim">
            <input
              type="checkbox"
              id="inStockOnly"
              checked={activeInStockOnly}
              onChange={(e) => updateQueryParams({ inStockOnly: e.target.checked ? "true" : undefined })}
              className="rounded border-surface-dim text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor="inStockOnly" className="text-xs font-heading font-semibold text-on-surface cursor-pointer">
              Show Available In-Stock Lots Only (Stock &gt; 0)
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-surface-dim">
            <Button variant="primary" size="sm" onClick={() => setIsFilterModalOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
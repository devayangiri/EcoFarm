"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ServiceCard } from "@/components/services/service-card";
import { Search, ShieldCheck } from "lucide-react";

export interface ServiceDirectoryBrowserProps {
  initialServices: Array<any>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function ServiceDirectoryBrowser({
  initialServices,
  pagination,
}: ServiceDirectoryBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "ALL");
  const [sector, setSector] = useState(searchParams.get("sector") || "ALL");
  const [pricingModel, setPricingModel] = useState(searchParams.get("pricingModel") || "ALL");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verifiedOnly") === "true");

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category && category !== "ALL") params.set("category", category);
    if (sector && sector !== "ALL") params.set("sector", sector);
    if (pricingModel && pricingModel !== "ALL") params.set("pricingModel", pricingModel);
    if (verifiedOnly) params.set("verifiedOnly", "true");

    router.push(`/services?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("ALL");
    setSector("ALL");
    setPricingModel("ALL");
    setVerifiedOnly(false);
    router.push("/services");
  };

  return (
    <div className="space-y-6 font-body text-left">
      {/* Search & Filter Bar */}
      <div className="p-4 bg-white rounded-lg border border-surface-dim shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4 relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              placeholder="Search machinery, cold storage, transport, testing..."
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-neutral" />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { label: "All Service Categories", value: "ALL" },
                { label: "Machinery Rental", value: "MACHINERY_RENTAL" },
                { label: "Warehouse Storage", value: "STORAGE" },
                { label: "Cold Chain Storage", value: "COLD_STORAGE" },
                { label: "Logistics & Fleet", value: "LOGISTICS" },
                { label: "Farm Transport", value: "TRANSPORT" },
                { label: "Soil Testing Labs", value: "SOIL_TESTING" },
                { label: "Water Quality Testing", value: "WATER_TESTING" },
                { label: "Farm Labor Crew", value: "LABOR" },
                { label: "Aquaculture Solutions", value: "AQUACULTURE_SERVICE" },
                { label: "Agronomy Consulting", value: "CONSULTING" },
              ]}
            />
          </div>

          <div className="sm:col-span-2">
            <Select
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value)}
              options={[
                { label: "All Price Models", value: "ALL" },
                { label: "Per Hour", value: "HOURLY" },
                { label: "Per Day", value: "DAILY" },
                { label: "Per Acre", value: "PER_ACRE" },
                { label: "Per Tonne", value: "PER_TON" },
                { label: "Fixed Rate", value: "FIXED" },
              ]}
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
            <Button
              variant={verifiedOnly ? "primary" : "outline"}
              size="md"
              className="flex-1 text-xs"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              leftIcon={<ShieldCheck className="h-4 w-4" />}
            >
              Verified
            </Button>

            <Button variant="primary" size="md" onClick={handleApplyFilters}>
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {initialServices.length === 0 ? (
        <EmptyState
          title="No Agricultural or Aquaculture Services Found"
          description="Try modifying your search keywords, category filter, or location to discover available machinery, cold chain, and testing solutions."
          actionLabel="Reset Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-neutral">
            <span>Showing {initialServices.length} of {pagination.total} registered commercial service solutions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialServices.map((s) => (
              <ServiceCard
                key={s.id}
                id={s.id}
                title={s.title}
                description={s.description}
                category={s.category}
                sector={s.sector}
                pricingModel={s.pricingModel}
                basePrice={s.basePrice}
                coverImageUrl={s.coverImageUrl}
                serviceArea={s.serviceArea}
                locationDistrict={s.locationDistrict}
                locationState={s.locationState}
                provider={s.provider}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

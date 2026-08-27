"use client";

import React, { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { Select } from "@/components/ui/select";
import { Sprout, Fish, LayoutGrid } from "lucide-react";

export interface MarketplaceShellProps {
  children: React.ReactNode;
  totalProductsCount?: number;
}

export function MarketplaceShell({ children, totalProductsCount = 5 }: MarketplaceShellProps) {
  const [activeSector, setActiveSector] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("NEWEST");

  const sectorTabs = [
    { id: "ALL", label: "All Commodities", icon: LayoutGrid },
    { id: "AGRICULTURE", label: "Agriculture Produce", icon: Sprout },
    { id: "AQUACULTURE", label: "Aquaculture & Fish", icon: Fish },
  ];

  return (
    <div className="space-y-6">
      {/* Sector Tabs */}
      <Tabs
        tabs={sectorTabs}
        activeTab={activeSector}
        onChange={setActiveSector}
        variant="underline"
      />

      {/* Toolbar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search crops, freshwater fish, seeds, fertilizers..."
        filterControls={
          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-40 h-10 text-xs"
              options={[
                { value: "NEWEST", label: "Newest Harvests" },
                { value: "PRICE_LOW", label: "Price: Low to High" },
                { value: "PRICE_HIGH", label: "Price: High to Low" },
                { value: "STOCK_HIGH", label: "Highest Available Stock" },
              ]}
            />
          </div>
        }
      />

      {/* Product Content Slot */}
      <div>{children}</div>
    </div>
  );
}

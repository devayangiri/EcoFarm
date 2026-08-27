"use client";

import React from "react";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterControls?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterControls,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-surface-dim shadow-sm",
        className
      )}
    >
      <div className="flex-1 max-w-md">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>

      <div className="flex items-center gap-2.5 flex-wrap justify-between md:justify-end">
        {filterControls}
        {actions}
      </div>
    </div>
  );
}

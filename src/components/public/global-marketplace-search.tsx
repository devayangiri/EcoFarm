"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEARCH_SUGGESTIONS = [
  { label: "Paddy", query: "Paddy" },
  { label: "Potato", query: "Potato" },
  { label: "Rohu Fish", query: "Rohu Fish" },
  { label: "Seeds", query: "Seeds" },
  { label: "Fertilizer", query: "Fertilizer" },
  { label: "Tractor", query: "Tractor" },
  { label: "Cold Storage", query: "Cold Storage" },
];

export function GlobalMarketplaceSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      router.push(`/marketplace?search=${encodeURIComponent(query)}`);
    } else {
      router.push("/marketplace");
    }
  };

  const handleChipClick = (query: string) => {
    setSearchTerm(query);
    router.push(`/marketplace?search=${encodeURIComponent(query)}`);
  };

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <section className="relative -mt-6 z-20 max-w-stitch-container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl border border-surface-dim p-4 sm:p-6 lg:p-7">
        <form onSubmit={handleSubmit} role="search" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Input Field with Icon */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-neutral">
                <Search className="h-5 w-5 text-brand-primary" />
              </div>
              <input
                type="text"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search commodities..."
                className="w-full pl-12 pr-10 py-3.5 sm:py-4 rounded-xl border border-surface-dim bg-surface-low text-on-surface text-sm sm:text-base placeholder:text-slate-neutral/70 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all shadow-inner"
                aria-label="Search commodities"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear search input"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-neutral hover:text-on-surface transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Search Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full md:w-auto min-h-[48px] sm:min-h-[52px] px-8 text-sm sm:text-base font-bold shadow-md gap-2 rounded-xl shrink-0"
            >
              <span>Search Marketplace</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Search Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-neutral">
            <span className="font-semibold text-on-surface flex items-center gap-1 shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-brand-secondary" />
              Popular:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {SEARCH_SUGGESTIONS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.query)}
                  className="px-2.5 py-1 rounded-lg border border-surface-dim bg-surface hover:bg-brand-primary/10 hover:border-brand-primary/30 hover:text-brand-primary text-slate-neutral text-xs font-medium transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

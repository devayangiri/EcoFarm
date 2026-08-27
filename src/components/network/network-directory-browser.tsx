"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NetworkCard } from "@/components/network/network-card";
import {
  Search,
  Filter,
  Users,
  ShieldCheck,
  Building2,
  Sprout,
  Waves,
} from "lucide-react";

export interface NetworkDirectoryBrowserProps {
  initialProfiles: Array<any>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function NetworkDirectoryBrowser({
  initialProfiles,
  pagination,
}: NetworkDirectoryBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [participantType, setParticipantType] = useState(searchParams.get("participantType") || "ALL");
  const [sector, setSector] = useState(searchParams.get("sector") || "ALL");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verifiedOnly") === "true");

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (participantType && participantType !== "ALL") params.set("participantType", participantType);
    if (sector && sector !== "ALL") params.set("sector", sector);
    if (verifiedOnly) params.set("verifiedOnly", "true");

    router.push(`/network?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearch("");
    setParticipantType("ALL");
    setSector("ALL");
    setVerifiedOnly(false);
    router.push("/network");
  };

  const participantTabs = [
    { label: "All Participants", value: "ALL" },
    { label: "Farmers & Producers", value: "FARMER" },
    { label: "Commercial Buyers", value: "BUYER" },
    { label: "Service Providers", value: "SERVICE_PROVIDER" },
  ];

  return (
    <div className="space-y-6 font-body text-left">
      {/* Top Search & Filter Bar */}
      <div className="p-4 bg-white rounded-lg border border-surface-dim shadow-sm space-y-4">
        {/* Participant Type Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {participantTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setParticipantType(tab.value);
                const params = new URLSearchParams(searchParams.toString());
                if (tab.value === "ALL") {
                  params.delete("participantType");
                } else {
                  params.set("participantType", tab.value);
                }
                router.push(`/network?${params.toString()}`);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-bold whitespace-nowrap transition-all ${
                participantType === tab.value
                  ? "bg-brand-primary text-white shadow-sm"
                  : "bg-surface-low text-slate-neutral hover:bg-surface-dim hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input and Auxiliary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              placeholder="Search by business name, category, crop, fish species, district..."
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-neutral" />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              options={[
                { label: "All Sectors", value: "ALL" },
                { label: "Agriculture Only", value: "AGRICULTURE" },
                { label: "Aquaculture Only", value: "AQUACULTURE" },
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

      {/* Directory Grid */}
      {initialProfiles.length === 0 ? (
        <EmptyState
          title="No Professional Participants Found"
          description="Try broadening your search term, sector, or removing filters to discover more agricultural and aquaculture entities."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-neutral">
            <span>Showing {initialProfiles.length} of {pagination.total} registered business participants</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialProfiles.map((p) => (
              <NetworkCard
                key={p.id}
                id={p.id}
                userId={p.userId}
                displayName={p.displayName}
                headline={p.headline}
                bio={p.bio}
                participantType={p.participantType}
                businessCategory={p.businessCategory}
                sector={p.sector}
                district={p.district}
                state={p.state}
                avatarUrl={p.avatarUrl}
                isVerified={p.isVerified}
                connectionCount={p.connectionCount}
                activeListingsCount={p.activeListingsCount}
                initialConnectionStatus={p.connectionStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

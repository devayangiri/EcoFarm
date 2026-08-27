"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NetworkEnquiryDialog } from "@/components/network/network-enquiry-dialog";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  MapPin,
  Users,
  Building2,
  Sprout,
  Waves,
  UserPlus,
  Check,
  Clock,
  MessageSquare,
  ChevronLeft,
  Globe,
  ExternalLink,
  Package,
} from "lucide-react";
import type { ConnectionStatusType } from "@/services/network.service";

export interface NetworkProfileViewProps {
  profile: {
    id: string;
    userId: string;
    displayName: string;
    headline?: string | null;
    bio?: string | null;
    participantType: string;
    businessCategory?: string | null;
    sector?: string | null;
    district: string;
    state: string;
    avatarUrl?: string | null;
    websiteUrl?: string | null;
    isBusiness?: boolean;
    businessRegNumber?: string | null;
    isVerified?: boolean;
    connectionCount: number;
    role: string;
    farmerInfo?: {
      experienceYears?: number | null;
      farms?: Array<{ id: string; name: string; sector: string; totalAreaAcres: number }>;
    } | null;
    buyerInfo?: {
      companyName?: string | null;
      buyerType?: string | null;
    } | null;
    activeProducts: Array<{
      id: string;
      slug: string;
      title: string;
      category: string;
      pricePerUnit: number;
      unit: string;
      imageUrl?: string | null;
    }>;
    connectionStatus: ConnectionStatusType;
    activeRequestId?: string | null;
  };
  currentUserRole?: string | null;
}

export function NetworkProfileView({ profile }: NetworkProfileViewProps) {
  const [connStatus, setConnStatus] = useState<ConnectionStatusType>(profile.connectionStatus);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendConnection = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/network/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile.userId }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setConnStatus("PENDING_SENT");
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/network"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-slate-neutral hover:text-brand-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Directory</span>
        </Link>
      </div>

      {/* Main Identity Banner Card */}
      <Card className="border border-surface-dim bg-white shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-heading font-extrabold text-2xl shrink-0 overflow-hidden border-2 border-surface-dim shadow-xs">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{profile.displayName.charAt(0)}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-extrabold text-on-surface">
                  {profile.displayName}
                </h1>
                {profile.isVerified && (
                  <ShieldCheck className="h-5 w-5 text-status-success shrink-0" />
                )}
              </div>

              <p className="text-sm font-medium text-brand-secondary">
                {profile.headline || `${profile.participantType} • ${profile.businessCategory || "Agri-Aqua Commercial Ecosystem"}`}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-neutral">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.district}, {profile.state}
                </span>

                <span>•</span>

                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {profile.connectionCount} Business Connections
                </span>

                {profile.websiteUrl && (
                  <>
                    <span>•</span>
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brand-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Website</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {connStatus === "SELF" ? (
              <Link href="/network/profile">
                <Button variant="outline" size="md">
                  Edit Network Identity
                </Button>
              </Link>
            ) : connStatus === "CONNECTED" ? (
              <Button variant="secondary" size="md" disabled className="gap-1.5">
                <Check className="h-4 w-4" />
                <span>Connected</span>
              </Button>
            ) : connStatus === "PENDING_SENT" ? (
              <Button variant="outline" size="md" disabled className="gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Request Pending</span>
              </Button>
            ) : connStatus === "PENDING_RECEIVED" ? (
              <Link href="/network/connections">
                <Button variant="secondary" size="md">
                  Review Connection Request
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSendConnection}
                isLoading={isLoading}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Connect
              </Button>
            )}

            {connStatus !== "SELF" && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsEnquiryOpen(true)}
                leftIcon={<MessageSquare className="h-4 w-4 text-brand-secondary" />}
              >
                Send Enquiry
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Profile Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: About & Entity Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* About Section */}
          <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-3">
            <h2 className="font-heading text-base font-bold text-on-surface">About Organization & Operations</h2>
            <p className="text-sm text-slate-neutral leading-relaxed whitespace-pre-wrap">
              {profile.bio || "This business participant has established their verified identity on Agri-Aqua Network."}
            </p>
          </Card>

          {/* Farmer Farms (if Farmer) */}
          {profile.farmerInfo?.farms && profile.farmerInfo.farms.length > 0 && (
            <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-4">
              <h2 className="font-heading text-base font-bold text-on-surface">Agricultural & Aqua Holding Facilities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.farmerInfo.farms.map((farm) => (
                  <div key={farm.id} className="p-3 bg-surface-low rounded border border-surface-dim text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-on-surface font-semibold">{farm.name}</strong>
                      <Badge variant={farm.sector === "AGRICULTURE" ? "primary" : "secondary"} size="sm">
                        {farm.sector}
                      </Badge>
                    </div>
                    <span className="text-slate-neutral block">Scale: {farm.totalAreaAcres} Acres</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Active Marketplace Listings */}
          {profile.activeProducts.length > 0 && (
            <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-bold text-on-surface">Active Wholesale Marketplace Lots</h2>
                <Link href="/marketplace" className="text-xs text-brand-primary font-semibold hover:underline">
                  Browse All
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {profile.activeProducts.map((p) => (
                  <Link key={p.id} href={`/marketplace/${p.id}`} className="group block p-3 bg-surface-low rounded border border-surface-dim hover:border-brand-primary transition-colors text-xs space-y-1">
                    <span className="text-[10px] font-heading font-semibold uppercase text-brand-secondary block">{p.category}</span>
                    <strong className="text-on-surface font-bold truncate block group-hover:text-brand-primary">{p.title}</strong>
                    <span className="font-mono text-brand-primary font-bold block">{formatCurrency(p.pricePerUnit)}/{p.unit}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Key Metrics & Business Overview */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-surface-dim bg-white shadow-sm p-5 space-y-4 text-xs">
            <h3 className="font-heading font-bold text-sm text-on-surface border-b border-surface-dim pb-2">
              Entity Overview
            </h3>

            <div className="space-y-2.5">
              <div className="flex justify-between py-1 border-b border-surface-dim">
                <span className="text-slate-neutral">Participant Type:</span>
                <span className="font-bold text-on-surface">{profile.participantType}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-surface-dim">
                <span className="text-slate-neutral">Ecosystem Sector:</span>
                <span className="font-bold text-on-surface">{profile.sector || "Agriculture"}</span>
              </div>

              {profile.farmerInfo?.experienceYears !== null && profile.farmerInfo?.experienceYears !== undefined && (
                <div className="flex justify-between py-1 border-b border-surface-dim">
                  <span className="text-slate-neutral">Sector Experience:</span>
                  <span className="font-bold text-on-surface">{profile.farmerInfo.experienceYears} Years</span>
                </div>
              )}

              {profile.businessRegNumber && (
                <div className="flex justify-between py-1 border-b border-surface-dim">
                  <span className="text-slate-neutral">Registration No:</span>
                  <span className="font-mono font-bold text-on-surface">{profile.businessRegNumber}</span>
                </div>
              )}

              <div className="flex justify-between py-1">
                <span className="text-slate-neutral">Trust Verification:</span>
                <span className="font-bold text-status-success">
                  {profile.isVerified ? "Verified B2B Entity" : "Registered Participant"}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              className="w-full mt-2"
              onClick={() => setIsEnquiryOpen(true)}
              leftIcon={<MessageSquare className="h-4 w-4" />}
            >
              Enquire Directly
            </Button>
          </Card>
        </div>
      </div>

      {/* Enquiry Modal */}
      <NetworkEnquiryDialog
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        targetUserId={profile.userId}
        targetName={profile.displayName}
        targetHeadline={profile.headline}
      />
    </div>
  );
}

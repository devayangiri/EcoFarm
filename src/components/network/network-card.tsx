"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowRight,
} from "lucide-react";
import type { ConnectionStatusType } from "@/services/network.service";

export interface NetworkCardProps {
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
  isVerified?: boolean;
  connectionCount: number;
  activeListingsCount?: number;
  initialConnectionStatus?: ConnectionStatusType;
  onSendRequest?: (userId: string) => Promise<void>;
}

export function NetworkCard({
  userId,
  displayName,
  headline,
  bio,
  participantType,
  businessCategory,
  sector,
  district,
  state,
  avatarUrl,
  isVerified = false,
  connectionCount,
  activeListingsCount = 0,
  initialConnectionStatus = "NONE",
}: NetworkCardProps) {
  const [connStatus, setConnStatus] = useState<ConnectionStatusType>(initialConnectionStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (connStatus !== "NONE") return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/network/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
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
    <Card className="group overflow-hidden rounded-lg border border-surface-dim bg-white transition-all hover:shadow-md hover:border-brand-secondary/30 flex flex-col justify-between text-left font-body">
      <CardContent className="p-5 space-y-4">
        {/* Top Header with Avatar and Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-heading font-bold text-base shrink-0 overflow-hidden border border-surface-dim">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{displayName.charAt(0)}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={`/network/${userId}`} className="truncate">
                  <h3 className="font-heading font-bold text-sm text-on-surface truncate group-hover:text-brand-primary transition-colors">
                    {displayName}
                  </h3>
                </Link>
                {isVerified && <ShieldCheck className="h-4 w-4 text-status-success shrink-0" />}
              </div>
              <p className="text-xs text-slate-neutral truncate">
                {headline || `${participantType} • ${businessCategory || "EcoFarm Network"}`}
              </p>
            </div>
          </div>

          <Badge variant={sector === "AQUACULTURE" ? "secondary" : "primary"} size="sm">
            {participantType}
          </Badge>
        </div>

        {/* Short Bio */}
        {bio && (
          <p className="text-xs text-slate-neutral line-clamp-2 leading-relaxed">
            {bio}
          </p>
        )}

        {/* Metadata Badges */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-dim text-[11px] text-slate-neutral">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-neutral/70" />
            <span className="truncate">{district}, {state}</span>
          </div>

          <div className="flex items-center gap-1 justify-end">
            <Users className="h-3.5 w-3.5 shrink-0 text-slate-neutral/70" />
            <span>{connectionCount} connections</span>
          </div>
        </div>
      </CardContent>

      {/* Footer CTAs */}
      <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-surface-low mt-1">
        <Link href={`/network/${userId}`} className="text-xs font-semibold text-slate-neutral hover:text-brand-primary">
          View Profile
        </Link>

        {connStatus === "SELF" ? (
          <Badge variant="outline" size="sm">You</Badge>
        ) : connStatus === "CONNECTED" ? (
          <Badge variant="success" size="sm" className="gap-1">
            <Check className="h-3 w-3" />
            <span>Connected</span>
          </Badge>
        ) : connStatus === "PENDING_SENT" ? (
          <Badge variant="info" size="sm" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>Request Sent</span>
          </Badge>
        ) : connStatus === "PENDING_RECEIVED" ? (
          <Link href="/network/connections">
            <Button variant="secondary" size="sm">
              Review Request
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            isLoading={isLoading}
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
          >
            Connect
          </Button>
        )}
      </div>
    </Card>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Package,
  Wrench,
  Building2,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Tag,
} from "lucide-react";

export interface ContextDetailsPanelProps {
  contextType?: "GENERAL" | "PRODUCT" | "ORDER" | "SERVICE" | "BUSINESS" | null;
  contextId?: string | null;
  contextSnapshot?: any;
  otherUser?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export function ContextDetailsPanel({
  contextType,
  contextId,
  contextSnapshot,
  otherUser,
}: ContextDetailsPanelProps) {
  if (!contextType || contextType === "GENERAL" || !contextSnapshot) {
    return (
      <div className="p-4 space-y-4 bg-white border-l border-surface-dim h-full font-body text-left">
        <h3 className="font-heading font-bold text-sm text-on-surface">Participant Details</h3>
        {otherUser ? (
          <div className="p-3 bg-surface-low rounded-lg border border-surface-dim space-y-2 text-xs">
            <strong className="font-heading font-bold text-sm text-on-surface block">
              {otherUser.fullName}
            </strong>
            <p className="text-slate-neutral">{otherUser.email}</p>
            <Badge variant="primary" size="sm">{otherUser.role}</Badge>
          </div>
        ) : (
          <p className="text-xs text-slate-neutral">Direct conversation thread.</p>
        )}

        <div className="p-3 bg-surface-low rounded text-[11px] text-slate-neutral space-y-1">
          <span className="font-semibold text-on-surface block">High-Trust B2B Protocol</span>
          <p>Messages exchanged here are verified and protected by the Agri-Aqua Network platform security.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-white border-l border-surface-dim h-full font-body text-left overflow-y-auto">
      <div className="flex items-center justify-between border-b border-surface-dim pb-2">
        <h3 className="font-heading font-bold text-sm text-on-surface">Context Details</h3>
        <Badge variant="secondary" size="sm">
          {contextType}
        </Badge>
      </div>

      {/* PRODUCT CONTEXT */}
      {contextType === "PRODUCT" && (
        <Card className="p-3 bg-surface-low border border-surface-dim shadow-xs space-y-3">
          {contextSnapshot.thumbnail && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={contextSnapshot.thumbnail}
              alt={contextSnapshot.title}
              className="w-full h-32 object-cover rounded"
            />
          )}
          <div className="space-y-1 text-xs">
            <strong className="font-heading font-bold text-sm text-on-surface block">
              {contextSnapshot.title}
            </strong>
            <span className="font-mono font-bold text-brand-primary text-sm block">
              {formatCurrency(contextSnapshot.price)}/{contextSnapshot.unit}
            </span>
            <p className="text-slate-neutral">Seller: {contextSnapshot.sellerName}</p>
          </div>

          <Link href={`/marketplace/${contextSnapshot.id}`} target="_blank">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
              <span>View Product Listing</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      )}

      {/* ORDER CONTEXT */}
      {contextType === "ORDER" && (
        <Card className="p-3 bg-surface-low border border-surface-dim shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <strong className="font-heading font-bold text-sm text-on-surface">
              Order #{contextSnapshot.orderNumber}
            </strong>
            <Badge variant="primary" size="sm">{contextSnapshot.status}</Badge>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-neutral">Total Amount:</span>
              <strong className="font-mono font-bold text-on-surface">
                {formatCurrency(contextSnapshot.total)}
              </strong>
            </div>
            {contextSnapshot.sellerName && (
              <div className="flex justify-between">
                <span className="text-slate-neutral">Fulfiller:</span>
                <span className="text-on-surface">{contextSnapshot.sellerName}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* SERVICE CONTEXT */}
      {contextType === "SERVICE" && (
        <Card className="p-3 bg-surface-low border border-surface-dim shadow-xs space-y-3 text-xs">
          <div className="space-y-1">
            <strong className="font-heading font-bold text-sm text-on-surface block">
              {contextSnapshot.title}
            </strong>
            <p className="text-slate-neutral">Provider: {contextSnapshot.providerName}</p>
            <span className="font-mono font-bold text-accent-aqua block">
              From {formatCurrency(contextSnapshot.basePrice)}
            </span>
          </div>

          <Link href={`/services/${contextSnapshot.id}`} target="_blank">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
              <span>View Service Card</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      )}

      {/* BUSINESS CONTEXT */}
      {contextType === "BUSINESS" && (
        <Card className="p-3 bg-surface-low border border-surface-dim shadow-xs space-y-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <strong className="font-heading font-bold text-sm text-on-surface">
                {contextSnapshot.name}
              </strong>
              {contextSnapshot.isVerified && (
                <ShieldCheck className="h-4 w-4 text-status-success" />
              )}
            </div>
            <p className="text-slate-neutral">{contextSnapshot.participantType}</p>
            <span className="text-[11px] text-slate-neutral flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {contextSnapshot.district}, {contextSnapshot.state}
            </span>
          </div>

          <Link href={`/network/${contextSnapshot.id}`} target="_blank">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
              <span>View Business Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

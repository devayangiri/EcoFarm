"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ProviderQuotationModal } from "@/components/services/provider-quotation-modal";
import { formatCurrency } from "@/lib/utils";
import {
  Check,
  X,
  Clock,
  Send,
  Wrench,
  ShieldCheck,
  MapPin,
  ChevronLeft,
  Calendar,
} from "lucide-react";

export interface ServiceRequestViewProps {
  request: {
    id: string;
    requestNumber: string;
    serviceId: string;
    serviceTitle: string;
    category: string;
    pricingModel: string;
    basePrice: number;
    providerBusinessName: string;
    isProviderVerified: boolean;
    requesterName: string;
    requiredDate: string;
    quantityOrScale: string;
    requirements: string;
    location: {
      villageOrStreet?: string | null;
      cityOrTown: string;
      district: string;
      state: string;
    };
    notes?: string | null;
    status: string;
    acceptedQuotationId?: string | null;
    quotations: Array<{
      id: string;
      quotationNumber: string;
      amount: number;
      currency: string;
      validUntil: string;
      terms?: string | null;
      notes?: string | null;
      status: string;
      createdAt: string;
    }>;
    timeline: Array<{
      id: string;
      status: string;
      note?: string | null;
      createdAt: string;
    }>;
    isRequester: boolean;
    isProvider: boolean;
    createdAt: string;
  };
}

export function ServiceRequestView({ request }: ServiceRequestViewProps) {
  const router = useRouter();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAcceptQuote = async (quotationId: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/services/quotations/${quotationId}/accept`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to accept quotation");

      setMessage({ type: "success", text: "Quotation accepted successfully! Status updated." });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectQuote = async (quotationId: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/services/quotations/${quotationId}/reject`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to decline quotation");

      setMessage({ type: "success", text: "Quotation declined." });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMilestone = async (targetStatus: "IN_PROGRESS" | "COMPLETED") => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/services/requests/${request.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update milestone");

      setMessage({ type: "success", text: `Service status updated to ${targetStatus}.` });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (st: string) => {
    switch (st) {
      case "OPEN": return "secondary";
      case "QUOTATION_SUBMITTED": return "info";
      case "ACCEPTED": return "primary";
      case "IN_PROGRESS": return "warning";
      case "COMPLETED": return "success";
      case "CANCELLED": return "error";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6 font-body text-left max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href={request.isProvider ? "/provider" : "/buyer/services"}
          className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-slate-neutral hover:text-brand-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{request.isProvider ? "Back to Provider Portal" : "Back to My Service Requests"}</span>
        </Link>

        <Badge variant={getStatusBadgeVariant(request.status)} size="md">
          {request.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {message && (
        <Alert variant={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Main Request Card */}
      <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-dim pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-brand-primary" />
              <h1 className="font-heading text-xl font-bold text-on-surface">
                {request.serviceTitle}
              </h1>
            </div>
            <p className="text-xs text-slate-neutral mt-0.5">
              Request #{request.requestNumber} • Placed {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Provider Action: Submit Quote */}
          {request.isProvider && (request.status === "OPEN" || request.status === "QUOTATION_SUBMITTED") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsQuoteModalOpen(true)}
              rightIcon={<Send className="h-3.5 w-3.5" />}
            >
              Submit Quotation
            </Button>
          )}

          {/* Provider Action: Execution Progress */}
          {request.isProvider && request.status === "ACCEPTED" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateMilestone("IN_PROGRESS")}
              isLoading={isLoading}
            >
              Mark In Progress
            </Button>
          )}

          {request.isProvider && request.status === "IN_PROGRESS" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleUpdateMilestone("COMPLETED")}
              isLoading={isLoading}
            >
              Mark Completed
            </Button>
          )}
        </div>

        {/* Scope Specifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-neutral block">Required Execution Date:</span>
            <span className="font-bold text-on-surface flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand-primary" />
              {new Date(request.requiredDate).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-neutral block">Scale / Volume:</span>
            <span className="font-bold text-on-surface">{request.quantityOrScale}</span>
          </div>
        </div>

        <div className="p-4 bg-surface-low rounded border border-surface-dim space-y-1 text-xs">
          <span className="font-semibold text-on-surface block">Technical Requirements:</span>
          <p className="text-slate-neutral leading-relaxed whitespace-pre-wrap">{request.requirements}</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-neutral">
          <MapPin className="h-3.5 w-3.5 text-brand-secondary" />
          <span>
            {request.location.villageOrStreet ? `${request.location.villageOrStreet}, ` : ""}
            {request.location.cityOrTown}, {request.location.district}, {request.location.state}
          </span>
        </div>
      </Card>

      {/* Quotations Section */}
      <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-4">
        <h2 className="font-heading text-base font-bold text-on-surface">Formal Quotations ({request.quotations.length})</h2>

        {request.quotations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-neutral bg-surface-low rounded border border-surface-dim">
            No formal quotation submitted yet. The provider will review specifications and submit pricing.
          </div>
        ) : (
          <div className="space-y-3">
            {request.quotations.map((q) => (
              <div key={q.id} className="p-4 rounded border border-surface-dim bg-surface-low/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-dim pb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-brand-primary">Quote #{q.quotationNumber}</span>
                    <span className="text-[11px] text-slate-neutral block">
                      Valid until {new Date(q.validUntil).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-extrabold text-brand-primary">
                      {formatCurrency(q.amount)}
                    </span>
                    <Badge
                      variant={q.status === "ACCEPTED" ? "success" : q.status === "REJECTED" ? "error" : "secondary"}
                      size="sm"
                    >
                      {q.status}
                    </Badge>
                  </div>
                </div>

                {q.terms && (
                  <div className="text-xs text-slate-neutral space-y-0.5">
                    <strong className="text-on-surface">Terms:</strong> {q.terms}
                  </div>
                )}

                {/* Buyer Actions */}
                {request.isRequester && q.status === "PENDING" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-dim">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectQuote(q.id)}
                      disabled={isLoading}
                      leftIcon={<X className="h-3.5 w-3.5" />}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptQuote(q.id)}
                      disabled={isLoading}
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                    >
                      Accept Quotation
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Execution Timeline */}
      <Card className="border border-surface-dim bg-white shadow-sm p-6 space-y-4">
        <h2 className="font-heading text-base font-bold text-on-surface">Execution Timeline</h2>
        <div className="space-y-3">
          {request.timeline.map((t, idx) => (
            <div key={t.id} className="flex items-start gap-3 text-xs">
              <div className="h-6 w-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                {idx + 1}
              </div>
              <div>
                <strong className="text-on-surface font-semibold">{t.status.replace(/_/g, " ")}</strong>
                {t.note && <p className="text-slate-neutral mt-0.5">{t.note}</p>}
                <span className="text-[10px] text-slate-neutral block">{new Date(t.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Provider Quote Modal */}
      <ProviderQuotationModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        serviceRequestId={request.id}
        requestNumber={request.requestNumber}
        requesterName={request.requesterName}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

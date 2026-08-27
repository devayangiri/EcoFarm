"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { DisputeStatus } from "@prisma/client";

export interface DisputeItem {
  id: string;
  title: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution?: string | null;
  raisedBy: { id: string; fullName: string; role: string };
  respondent?: { id: string; fullName: string; role: string } | null;
  resolvedBy?: { id: string; fullName: string } | null;
  order?: { id: string; subOrderNumber: string } | null;
  createdAt: string;
}

export function DisputesView({ initialDisputes }: { initialDisputes: DisputeItem[] }) {
  const [disputes, setDisputes] = useState<DisputeItem[]>(initialDisputes);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [status, setStatus] = useState<DisputeStatus>("RESOLVED");
  const [resolution, setResolution] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleResolve = (d: DisputeItem) => {
    setSelectedDispute(d);
    setStatus("RESOLVED");
    setResolution(d.resolution || "");
    setFeedback(null);
  };

  const handleConfirm = async () => {
    if (!selectedDispute) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update dispute");

      setDisputes((prev) =>
        prev.map((d) => (d.id === selectedDispute.id ? { ...d, status, resolution } : d))
      );
      setFeedback({ type: "success", message: "Dispute resolution saved." });
      setSelectedDispute(null);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="border-b border-surface-dim pb-4 space-y-1">
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
          Dispute Management
        </h1>
        <p className="text-xs text-slate-neutral">
          Mediate transaction conflicts between buyers, farmers, and service providers.
        </p>
      </div>

      {feedback && <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>{feedback.message}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disputes.map((d) => (
          <Card key={d.id} className="p-4 bg-white border border-surface-dim shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <strong className="font-heading font-bold text-sm text-on-surface block">{d.title}</strong>
                <span className="text-xs text-slate-neutral">{d.reason}</span>
              </div>
              <Badge variant={d.status === "OPEN" ? "error" : "primary"} size="sm">{d.status}</Badge>
            </div>

            <p className="text-xs text-slate-neutral bg-surface-low p-2.5 rounded-lg">{d.description}</p>

            <div className="text-[11px] text-slate-neutral space-y-0.5 border-t border-surface-dim pt-2">
              <div>Raised by: <strong>{d.raisedBy.fullName}</strong> ({d.raisedBy.role})</div>
              {d.respondent && <div>Respondent: <strong>{d.respondent.fullName}</strong> ({d.respondent.role})</div>}
              {d.order && <div>Linked Order: #{d.order.subOrderNumber}</div>}
              <div>Created: {formatDate(d.createdAt)}</div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => handleResolve(d)} className="text-xs h-8">
                Resolve Dispute
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedDispute && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-surface-dim text-left">
            <h3 className="font-heading font-bold text-base text-on-surface">
              Resolve Dispute: {selectedDispute.title}
            </h3>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-on-surface">Dispute Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DisputeStatus)}
                className="w-full h-9 rounded-lg border border-surface-dim bg-surface-low px-3 text-xs"
              >
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-on-surface">Resolution Description *</label>
              <textarea
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="State binding mediation resolution for both parties..."
                className="w-full rounded-lg border border-surface-dim bg-surface-low p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
              <Button variant="outline" size="sm" onClick={() => setSelectedDispute(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!resolution.trim() || isSubmitting} isLoading={isSubmitting}>
                Save Resolution
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

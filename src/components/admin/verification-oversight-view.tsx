"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { ShieldCheck, UserCheck, FileText } from "lucide-react";
import { VerificationStatus, VerificationType } from "@prisma/client";

export interface VerificationItem {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  user: { id: string; fullName: string; email: string; role: string };
  reviewer?: { id: string; fullName: string } | null;
  reviewNotes?: string | null;
  documents: { id: string; documentType: string; originalFileName: string; mimeType: string }[];
  submittedAt: string;
}

export function VerificationOversightView({ initialRequests }: { initialRequests: VerificationItem[] }) {
  const [requests, setRequests] = useState<VerificationItem[]>(initialRequests);
  const [selectedReq, setSelectedReq] = useState<VerificationItem | null>(null);
  const [reviewerId, setReviewerId] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleAssign = (req: VerificationItem) => {
    setSelectedReq(req);
    setReviewerId(req.reviewer?.id || "");
    setReviewNotes(req.reviewNotes || "");
    setFeedback(null);
  };

  const handleConfirmAssign = async () => {
    if (!selectedReq) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/verification/${selectedReq.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId: reviewerId || null, reviewNotes }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to assign reviewer");

      setFeedback({ type: "success", message: "Verification reviewer assignment updated." });
      setSelectedReq(null);
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
          Global Verification Oversight
        </h1>
        <p className="text-xs text-slate-neutral">
          Review KYC verifications across all user roles and assign field agents/moderators.
        </p>
      </div>

      {feedback && <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>{feedback.message}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map((r) => (
          <Card key={r.id} className="p-4 bg-white border border-surface-dim shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <strong className="font-heading font-bold text-sm text-on-surface block">
                  {r.user.fullName}
                </strong>
                <span className="text-xs text-slate-neutral">{r.user.email} • {r.user.role}</span>
              </div>
              <Badge variant={r.status === "APPROVED" ? "primary" : r.status === "PENDING" ? "warning" : "error"} size="sm">
                {r.status}
              </Badge>
            </div>

            <div className="text-xs space-y-1 border-t border-b border-surface-dim py-2 text-slate-neutral">
              <div>Type: <strong className="text-on-surface">{r.type}</strong></div>
              <div>Submitted: {formatDate(r.submittedAt)}</div>
              <div>Reviewer: <strong>{r.reviewer?.fullName || "Unassigned"}</strong></div>
              <div>Documents: {r.documents.length} attached</div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => handleAssign(r)} className="text-xs h-8 gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                Assign / Reassign
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedReq && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-surface-dim text-left">
            <h3 className="font-heading font-bold text-base text-on-surface">
              Assign Verification: {selectedReq.user.fullName}
            </h3>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-on-surface">Reviewer User ID (UUID) or Empty to unassign</label>
              <input
                type="text"
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                placeholder="Agent / Admin User UUID"
                className="w-full h-9 rounded-lg border border-surface-dim bg-surface-low px-3 text-xs"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-on-surface">Review Notes</label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Instructions or remarks for the reviewer..."
                className="w-full rounded-lg border border-surface-dim bg-surface-low p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
              <Button variant="outline" size="sm" onClick={() => setSelectedReq(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmAssign} isLoading={isSubmitting}>
                Save Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

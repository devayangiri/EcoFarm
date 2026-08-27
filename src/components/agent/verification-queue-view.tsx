"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ShieldCheck, ShieldAlert, FileText, Check, X, Edit, Eye } from "lucide-react";

export interface VerificationQueueViewProps {
  cases: Array<{
    id: string;
    applicant: {
      name: string;
      email: string;
      phone?: string | null;
      role: string;
    };
    type: string;
    status: string;
    submittedAt: string;
    reviewedAt?: string | null;
    reviewNotes?: string | null;
    documentsCount: number;
    documents: Array<{
      id: string;
      documentType: string;
      originalFileName: string;
      fileSizeBytes: number;
    }>;
  }>;
}

export function VerificationQueueView({ cases }: VerificationQueueViewProps) {
  const router = useRouter();
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "request-changes" | "reject") => {
    if (!selectedCase) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/agent/verification/${selectedCase.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to submit decision");

      setSelectedCase(null);
      setReviewNotes("");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="space-y-1 border-b border-surface-dim pb-4">
        <h1 className="font-heading text-2xl font-bold text-on-surface">Verification Review Queue</h1>
        <p className="text-xs text-slate-neutral">
          Review land title deeds, GST registration, trade licenses, and identity credentials.
        </p>
      </div>

      {cases.length === 0 ? (
        <EmptyState
          title="Verification Backlog Empty"
          description="All submitted verification applications have been reviewed."
        />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Card key={c.id} className="p-4 bg-white border border-surface-dim shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="font-heading font-bold text-sm text-on-surface truncate">{c.applicant.name}</strong>
                  <Badge variant="primary" size="sm">{c.applicant.role}</Badge>
                  <Badge variant={c.status === "APPROVED" ? "success" : c.status === "REJECTED" ? "error" : "warning"} size="sm">
                    {c.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-neutral">
                  Type: <strong className="text-on-surface">{c.type.replace(/_/g, " ")}</strong> • {c.documentsCount} documents uploaded
                </p>
                <span className="text-[11px] text-slate-neutral block">
                  Submitted: {new Date(c.submittedAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedCase(c);
                    setReviewNotes(c.reviewNotes || "");
                  }}
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                >
                  Review Case
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        title="Verify Applicant Credentials"
        description={`Review submitted documents for ${selectedCase?.applicant?.name} (${selectedCase?.applicant?.role}).`}
        maxWidth="lg"
      >
        <div className="space-y-4 font-body text-left">
          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {/* Documents summary */}
          <div className="space-y-2">
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-neutral block">
              Uploaded Verification Documents ({selectedCase?.documents?.length || 0})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedCase?.documents?.map((d: any) => (
                <div key={d.id} className="p-3 bg-surface-low rounded border border-surface-dim flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <strong className="font-semibold text-on-surface block truncate">{d.originalFileName}</strong>
                    <span className="text-[11px] text-slate-neutral">{d.documentType} • {Math.round(d.fileSizeBytes / 1024)} KB</span>
                  </div>
                  <Badge variant="outline" size="sm">Valid</Badge>
                </div>
              ))}
            </div>
          </div>

          <FormField label="Reviewer Notes & Decision Comments" required>
            <Textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="e.g. Land registry mutation verified against State portal. Approved."
            />
          </FormField>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-surface-dim">
            <Button variant="outline" size="sm" onClick={() => setSelectedCase(null)} disabled={isLoading}>
              Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("request-changes")}
              disabled={isLoading}
            >
              Request Changes
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleAction("reject")}
              disabled={isLoading}
            >
              Reject Application
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction("approve")}
              disabled={isLoading}
              leftIcon={<ShieldCheck className="h-4 w-4" />}
            >
              Approve Verification
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

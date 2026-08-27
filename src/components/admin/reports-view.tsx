"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { Flag } from "lucide-react";
import { ReportStatus, ReportTargetType } from "@prisma/client";

export interface ReportItem {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string;
  status: ReportStatus;
  resolutionNotes?: string | null;
  reporter: { id: string; fullName: string; email: string };
  resolvedBy?: { id: string; fullName: string } | null;
  createdAt: string;
}

export function ReportsView({ initialReports }: { initialReports: ReportItem[] }) {
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [status, setStatus] = useState<ReportStatus>("RESOLVED");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleResolve = (r: ReportItem) => {
    setSelectedReport(r);
    setStatus("RESOLVED");
    setNotes(r.resolutionNotes || "");
    setFeedback(null);
  };

  const handleConfirm = async () => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolutionNotes: notes }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to resolve report");

      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? { ...r, status, resolutionNotes: notes } : r))
      );
      setFeedback({ type: "success", message: "Report resolution saved." });
      setSelectedReport(null);
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
          Moderation Reports
        </h1>
        <p className="text-xs text-slate-neutral">
          Investigate content and user violation reports across Products, Services, Messages, and Businesses.
        </p>
      </div>

      {feedback && <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>{feedback.message}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <Card key={r.id} className="p-4 bg-white border border-surface-dim shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <strong className="font-heading font-bold text-sm text-on-surface block">
                  Report: {r.targetType} #{r.targetId.slice(0, 8)}
                </strong>
                <span className="text-xs text-slate-neutral">{r.reason}</span>
              </div>
              <Badge variant={r.status === "OPEN" ? "error" : "primary"} size="sm">{r.status}</Badge>
            </div>

            <p className="text-xs text-slate-neutral bg-surface-low p-2.5 rounded-lg">{r.description}</p>

            <div className="text-[11px] text-slate-neutral space-y-0.5 border-t border-surface-dim pt-2">
              <div>Reporter: <strong>{r.reporter.fullName}</strong> ({r.reporter.email})</div>
              <div>Reported Date: {formatDate(r.createdAt)}</div>
              {r.resolutionNotes && <div>Resolution: {r.resolutionNotes}</div>}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => handleResolve(r)} className="text-xs h-8">
                Handle Report
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-surface-dim text-left">
            <h3 className="font-heading font-bold text-base text-on-surface">
              Resolve Report: {selectedReport.targetType} #{selectedReport.targetId.slice(0, 8)}
            </h3>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-on-surface">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReportStatus)}
                className="w-full h-9 rounded-lg border border-surface-dim bg-surface-low px-3 text-xs"
              >
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="DISMISSED">DISMISSED</option>
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-on-surface">Resolution Notes *</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="State outcome and actions taken..."
                className="w-full rounded-lg border border-surface-dim bg-surface-low p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
              <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!notes.trim() || isSubmitting} isLoading={isSubmitting}>
                Save Resolution
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

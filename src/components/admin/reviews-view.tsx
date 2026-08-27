"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { Star, EyeOff, Check } from "lucide-react";
import { ReviewStatus } from "@prisma/client";

export interface ReviewItem {
  id: string;
  author: { id: string; fullName: string };
  targetType: string;
  targetId: string;
  rating: number;
  comment?: string | null;
  status: ReviewStatus;
  moderationReason?: string | null;
  createdAt: string;
}

export function ReviewsView({ initialReviews }: { initialReviews: ReviewItem[] }) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleModerate = async (reviewId: string, newStatus: ReviewStatus) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, moderationReason: "Moderated by administrator" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to moderate review");

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
      );
      setFeedback({ type: "success", message: `Review status set to ${newStatus}.` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="border-b border-surface-dim pb-4 space-y-1">
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
          Review & Reputation Moderation
        </h1>
        <p className="text-xs text-slate-neutral">
          Moderate user feedback, prevent abusive content, and maintain high-trust marketplace ratings.
        </p>
      </div>

      {feedback && <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>{feedback.message}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((r) => (
          <Card key={r.id} className="p-4 bg-white border border-surface-dim shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-500" : "text-gray-300"}`} />
                  ))}
                  <span className="text-xs font-bold text-on-surface ml-1">{r.rating}/5</span>
                </div>
                <span className="text-xs text-slate-neutral">Author: {r.author.fullName} • Target: {r.targetType}</span>
              </div>
              <Badge variant={r.status === "APPROVED" ? "primary" : "error"} size="sm">{r.status}</Badge>
            </div>

            {r.comment && <p className="text-xs text-slate-neutral bg-surface-low p-2 rounded-lg">{r.comment}</p>}

            <div className="flex items-center justify-between border-t border-surface-dim pt-2 text-[11px] text-slate-neutral">
              <span>{formatDate(r.createdAt)}</span>
              <div className="space-x-1">
                {r.status !== "APPROVED" && (
                  <Button variant="outline" size="sm" onClick={() => handleModerate(r.id, "APPROVED")} className="text-[11px] h-7 px-2">
                    Approve
                  </Button>
                )}
                {r.status !== "HIDDEN" && (
                  <Button variant="outline" size="sm" onClick={() => handleModerate(r.id, "HIDDEN")} className="text-[11px] h-7 px-2 text-status-warning">
                    Hide
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

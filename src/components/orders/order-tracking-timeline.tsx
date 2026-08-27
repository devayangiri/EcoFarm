import React from "react";
import { CheckCircle2, Clock, Truck, Package, AlertCircle } from "lucide-react";
import { OrderStatus } from "@prisma/client";

export interface OrderTrackingTimelineProps {
  currentStatus: OrderStatus;
  timeline: Array<{
    id: string;
    status: OrderStatus;
    note: string | null;
    createdAt: Date | string;
  }>;
}

export function OrderTrackingTimeline({
  currentStatus,
  timeline,
}: OrderTrackingTimelineProps) {
  const steps: Array<{ status: OrderStatus; label: string }> = [
    { status: "PLACED", label: "Order Placed" },
    { status: "CONFIRMED", label: "Producer Confirmed" },
    { status: "PROCESSING", label: "Harvest / Sorting" },
    { status: "SHIPPED", label: "Dispatched in Transit" },
    { status: "DELIVERED", label: "Delivered & Inspected" },
    { status: "COMPLETED", label: "Settlement Complete" },
  ];

  const getStatusIndex = (st: OrderStatus) => {
    return steps.findIndex((s) => s.status === st);
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="space-y-6 font-body text-left">
      {/* Horizontal Step Bar */}
      <div className="relative flex items-center justify-between">
        {/* Background connector line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-surface-dim -translate-y-1/2 z-0" />
        
        {steps.map((step, idx) => {
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center group">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-brand-primary text-white ring-4 ring-brand-primary/20"
                    : isPassed
                    ? "bg-status-success text-white"
                    : "bg-surface-low border border-surface-dim text-slate-neutral"
                }`}
              >
                {isPassed ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] font-heading font-semibold mt-2 text-center max-w-[80px] hidden sm:block ${
                  isCurrent ? "text-brand-primary font-bold" : isPassed ? "text-on-surface" : "text-slate-neutral"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline Event Log */}
      {timeline.length > 0 && (
        <div className="pt-4 border-t border-surface-dim space-y-3">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-neutral block">
            Shipment Log History
          </span>
          <div className="space-y-2">
            {timeline.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-xs bg-surface-low p-2.5 rounded border border-surface-dim">
                <Clock className="h-3.5 w-3.5 text-brand-secondary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-on-surface font-semibold">{entry.status}</strong>
                    <span className="text-[11px] text-slate-neutral">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {entry.note && <p className="text-slate-neutral mt-0.5">{entry.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}: DialogProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card / Mobile Bottom Sheet */}
      <div
        className={cn(
          "relative w-full bg-white rounded-t-2xl sm:rounded-lg border border-surface-dim shadow-stitch-modal p-6 space-y-4 z-10 animate-fadeIn max-h-[90dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6",
          maxWidthMap[maxWidth]
        )}
      >
        {/* Mobile Swipe/Pull Handle Indicator */}
        <div className="w-12 h-1 bg-surface-dim rounded-full mx-auto -mt-2 mb-2 sm:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 id="dialog-title" className="font-heading text-lg font-bold text-on-surface">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-slate-neutral mt-0.5 font-body">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 -mt-2 rounded-full text-slate-neutral hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-surface-dim">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

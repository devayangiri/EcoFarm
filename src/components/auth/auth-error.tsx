"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";

export interface AuthErrorProps {
  message?: string | null;
  onDismiss?: () => void;
}

export function AuthError({ message, onDismiss }: AuthErrorProps) {
  if (!message) return null;

  return (
    <div className="flex items-start justify-between gap-3 p-3.5 rounded border border-status-error/30 bg-status-error/10 text-status-error text-xs font-body animate-fadeIn">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span className="leading-snug">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-status-error hover:opacity-70 transition-opacity"
          aria-label="Dismiss error"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

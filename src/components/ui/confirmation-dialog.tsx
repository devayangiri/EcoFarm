"use client";

import React from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { AlertTriangle, Info, Trash2 } from "lucide-react";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 className="h-5 w-5 text-status-error" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-status-warning" />;
      case "info":
        return <Info className="h-5 w-5 text-status-info" />;
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 pt-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-low border border-surface-dim">
          {getIcon()}
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-sm font-bold text-on-surface">{title}</h3>
          <p className="text-xs text-slate-neutral font-body leading-relaxed">{message}</p>
        </div>
      </div>
    </Dialog>
  );
}

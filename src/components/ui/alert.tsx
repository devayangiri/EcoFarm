import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  onDismiss?: () => void;
}

const variantStyles = {
  info: {
    container: "bg-status-info/10 border-status-info/30 text-status-info",
    icon: Info,
  },
  success: {
    container: "bg-status-success/10 border-status-success/30 text-status-success",
    icon: CheckCircle2,
  },
  warning: {
    container: "bg-status-warning/10 border-status-warning/30 text-status-warning",
    icon: AlertTriangle,
  },
  error: {
    container: "bg-status-error/10 border-status-error/30 text-status-error",
    icon: AlertCircle,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  onDismiss,
  className,
  ...props
}: AlertProps) {
  const { container, icon: Icon } = variantStyles[variant];

  return (
    <div
      role="alert"
      className={cn("flex items-start justify-between gap-3 p-3.5 rounded border text-xs font-body animate-fadeIn", container, className)}
      {...props}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-snug">
          {title && <span className="font-heading font-bold block">{title}</span>}
          <div className="text-on-surface/90">{children}</div>
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="hover:opacity-70 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

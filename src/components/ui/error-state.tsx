import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-status-error/20 bg-status-error/5 space-y-3 font-body",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-error/10 text-status-error">
        <AlertCircle className="h-5 w-5" />
      </div>

      <div className="max-w-sm space-y-1">
        <h3 className="font-heading text-sm font-bold text-status-error">{title}</h3>
        <p className="text-xs text-slate-neutral leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

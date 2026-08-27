import React from "react";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  message = "Loading data...",
  size = "md",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center space-y-2.5 font-body",
        className
      )}
    >
      <Spinner size={size} className="text-brand-secondary" />
      {message && (
        <p className="text-xs text-slate-neutral font-medium">{message}</p>
      )}
    </div>
  );
}

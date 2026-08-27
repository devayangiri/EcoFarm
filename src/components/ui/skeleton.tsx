import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({
  className,
  variant = "rectangular",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-surface-dim/60",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 rounded-sm w-3/4",
        variant === "rectangular" && "rounded",
        className
      )}
      {...props}
    />
  );
}

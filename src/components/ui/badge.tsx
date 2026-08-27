import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-body transition-colors",
  {
    variants: {
      variant: {
        default: "bg-surface-high text-on-surface border border-surface-dim",
        primary: "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
        secondary: "bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20",
        success: "bg-status-success-bg text-status-success border border-status-success/20",
        warning: "bg-status-warning-bg text-status-warning border border-status-warning/20",
        error: "bg-status-error-bg text-status-error border border-status-error/20",
        info: "bg-status-info-bg text-status-info border border-status-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

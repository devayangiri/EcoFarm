import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center font-heading font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
        secondary: "bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20",
        success: "bg-status-success/10 text-status-success border border-status-success/20",
        warning: "bg-status-warning/10 text-status-warning border border-status-warning/20",
        error: "bg-status-error/10 text-status-error border border-status-error/20",
        info: "bg-status-info/10 text-status-info border border-status-info/20",
        neutral: "bg-surface-high text-slate-neutral border border-surface-dim",
        outline: "bg-transparent text-on-surface border border-surface-dim",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px] tracking-wide rounded-full gap-1",
        md: "px-2.5 py-0.5 text-xs tracking-normal rounded-full gap-1.5",
        lg: "px-3 py-1 text-xs tracking-normal rounded-full gap-1.5 font-bold",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-status-success",
            variant === "warning" && "bg-status-warning",
            variant === "error" && "bg-status-error",
            variant === "info" && "bg-status-info",
            variant === "primary" && "bg-brand-primary",
            variant === "secondary" && "bg-brand-secondary",
            (!variant || variant === "neutral" || variant === "outline") && "bg-slate-neutral"
          )}
        />
      )}
      {children}
    </div>
  );
}

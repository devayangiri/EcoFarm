import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export const iconButtonVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.95] select-none shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-white hover:bg-brand-primary-hover shadow-sm",
        secondary: "bg-brand-secondary text-white hover:bg-brand-secondary-hover shadow-sm",
        outline: "border border-surface-dim bg-white text-on-surface hover:bg-surface-low hover:border-brand-secondary/40 shadow-sm",
        ghost: "bg-transparent text-slate-neutral hover:bg-surface-container hover:text-on-surface",
        subtle: "bg-surface-container text-brand-secondary hover:bg-surface-high hover:text-brand-primary",
      },
      size: {
        xs: "h-7 w-7 rounded-sm p-1 text-xs",
        sm: "h-8 w-8 rounded-sm p-1.5 text-sm",
        md: "h-10 w-10 rounded p-2 text-base",
        lg: "h-12 w-12 rounded-md p-2.5 text-lg",
      },
      shape: {
        rounded: "",
        circle: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
      shape: "rounded",
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  icon: React.ReactNode;
  label: string;
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, shape, icon, label, isLoading = false, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(iconButtonVariants({ variant, size, shape, className }))}
        disabled={disabled || isLoading}
        aria-label={label}
        title={label}
        {...props}
      >
        {isLoading ? <Spinner size={size === "xs" || size === "sm" ? "xs" : "sm"} /> : icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

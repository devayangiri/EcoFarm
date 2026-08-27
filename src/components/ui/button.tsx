import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-heading font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-primary text-white hover:bg-brand-primary-hover shadow-sm border border-transparent",
        secondary:
          "bg-brand-secondary text-white hover:bg-brand-secondary-hover shadow-sm border border-transparent",
        outline:
          "border border-surface-dim bg-white text-on-surface hover:bg-surface-low hover:border-brand-secondary/40 shadow-sm",
        ghost:
          "bg-transparent text-on-surface hover:bg-surface-container hover:text-brand-primary",
        danger:
          "bg-status-error text-white hover:bg-red-800 shadow-sm border border-transparent",
        link:
          "bg-transparent text-brand-secondary underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-sm gap-1.5",
        md: "h-10 px-4 text-sm rounded gap-2",
        lg: "h-12 px-6 text-base rounded-md gap-2.5",
        icon: "h-10 w-10 p-0 rounded flex items-center justify-center",
        "icon-sm": "h-8 w-8 p-0 rounded-sm flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={size === "lg" ? "md" : "sm"} />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

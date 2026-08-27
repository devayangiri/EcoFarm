import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded font-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-primary text-white shadow hover:bg-brand-primary-hover active:bg-brand-primary-hover",
        secondary:
          "border border-brand-secondary text-brand-secondary bg-transparent hover:bg-surface-container active:bg-surface-high",
        solidSecondary:
          "bg-brand-secondary text-white shadow hover:bg-brand-secondary-hover active:bg-brand-secondary-hover",
        outline:
          "border border-surface-dim bg-white text-on-surface hover:bg-surface-low active:bg-surface-container",
        ghost:
          "text-on-surface hover:bg-surface-container hover:text-brand-primary",
        destructive:
          "bg-status-error text-white hover:bg-red-700 active:bg-red-800",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-sm",
        default: "h-10 px-4 py-2 text-sm rounded",
        lg: "h-12 px-6 text-base rounded-md font-semibold",
        icon: "h-10 w-10 p-0 rounded",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

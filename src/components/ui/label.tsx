import React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-xs font-heading font-semibold text-on-surface select-none",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-status-error ml-0.5">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";

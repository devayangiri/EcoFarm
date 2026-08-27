import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, disabled, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex items-start gap-2.5 select-none">
        <div className="relative flex items-center h-5">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-4 w-4 rounded-sm border border-surface-dim bg-white transition-all flex items-center justify-center peer-checked:bg-brand-primary peer-checked:border-brand-primary peer-focus-visible:ring-2 peer-focus-visible:ring-brand-secondary peer-focus-visible:ring-offset-1 peer-disabled:bg-surface-low peer-disabled:cursor-not-allowed",
              className
            )}
          >
            <Check className="h-3 w-3 text-white stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        {(label || description) && (
          <label htmlFor={inputId} className="text-xs font-body cursor-pointer">
            {label && <span className="font-semibold text-on-surface block">{label}</span>}
            {description && <span className="text-slate-neutral text-[11px] block">{description}</span>}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

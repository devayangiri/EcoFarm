import React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: string;
  className?: string;
}

export function Switch({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className,
}: SwitchProps) {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  return (
    <div className={cn("flex items-center justify-between gap-3 select-none", className)}>
      {(label || description) && (
        <label htmlFor={switchId} className="cursor-pointer">
          {label && <span className="font-heading font-semibold text-xs text-on-surface block">{label}</span>}
          {description && <span className="text-slate-neutral text-[11px] font-body block">{description}</span>}
        </label>
      )}
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-brand-primary" : "bg-surface-dim"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

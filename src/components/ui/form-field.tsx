import React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5 text-left font-body", className)}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {hint && !error && <p className="text-[11px] text-slate-neutral/80">{hint}</p>}
      {error && <p className="text-[11px] text-status-error font-medium">{error}</p>}
    </div>
  );
}

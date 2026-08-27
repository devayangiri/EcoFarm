import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leftIcon, rightIcon, isError, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-neutral/70">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          className={cn(
            "w-full h-10 rounded border bg-white px-3 text-sm text-on-surface font-body placeholder:text-slate-neutral/50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary disabled:bg-surface-low disabled:text-slate-neutral/50 disabled:cursor-not-allowed",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            isError ? "border-status-error focus:ring-status-error" : "border-surface-dim",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-neutral/70">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

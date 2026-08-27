import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
  maxCharacters?: number;
  currentCharacters?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, isError, maxCharacters, currentCharacters, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            "w-full min-h-[90px] rounded border bg-white p-3 text-sm text-on-surface font-body placeholder:text-slate-neutral/50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary disabled:bg-surface-low disabled:cursor-not-allowed resize-y",
            isError ? "border-status-error focus:ring-status-error" : "border-surface-dim",
            className
          )}
          {...props}
        />
        {maxCharacters && (
          <div className="text-right text-[11px] text-slate-neutral/70 font-mono">
            {currentCharacters ?? 0}/{maxCharacters}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

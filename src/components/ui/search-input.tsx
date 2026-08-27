"use client";

import React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
  shortcutBadge?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value,
      onChange,
      onClear,
      isLoading = false,
      shortcutBadge,
      placeholder = "Search commodities, varieties, services...",
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-neutral/70">
          <Search className="h-4 w-4" />
        </div>

        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 pl-9 pr-14 rounded border border-surface-dim bg-white text-sm text-on-surface font-body placeholder:text-slate-neutral/50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-secondary",
            className
          )}
          {...props}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 gap-1.5">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-neutral/70" />}
          {value && !isLoading && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                onClear?.();
              }}
              className="p-1 rounded text-slate-neutral hover:text-on-surface hover:bg-surface-container transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {shortcutBadge && !value && (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-neutral bg-surface-low border border-surface-dim rounded">
              {shortcutBadge}
            </kbd>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

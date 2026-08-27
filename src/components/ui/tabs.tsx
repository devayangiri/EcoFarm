"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ElementType;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "underline" | "pills";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className,
}: TabsProps) {
  if (variant === "pills") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 p-1 bg-surface-low rounded border border-surface-dim", className)} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-heading font-semibold transition-all select-none",
                isActive
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-neutral hover:text-on-surface hover:bg-surface-container"
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 text-[10px] rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-surface-high text-slate-neutral"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline Tabs (Standard Stitch)
  return (
    <div className={cn("flex items-center gap-6 border-b border-surface-dim overflow-x-auto no-scrollbar", className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative inline-flex items-center gap-2 pb-3 pt-1 text-sm font-heading font-semibold transition-all select-none border-b-2 -mb-px whitespace-nowrap",
              isActive
                ? "border-brand-primary text-brand-primary font-bold"
                : "border-transparent text-slate-neutral hover:text-on-surface hover:border-surface-dim"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] rounded-full font-bold",
                  isActive ? "bg-brand-primary/10 text-brand-primary" : "bg-surface-high text-slate-neutral"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

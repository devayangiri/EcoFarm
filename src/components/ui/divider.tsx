import React from "react";
import { cn } from "@/lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: string;
}

export function Divider({
  orientation = "horizontal",
  label,
  className,
  ...props
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        className={cn("inline-block w-px self-stretch bg-surface-dim mx-2", className)}
        role="separator"
        aria-orientation="vertical"
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        className={cn("flex items-center gap-3 my-4 text-xs text-slate-neutral/70 font-heading font-semibold uppercase tracking-wider", className)}
        role="separator"
        {...props}
      >
        <div className="flex-1 h-px bg-surface-dim" />
        <span>{label}</span>
        <div className="flex-1 h-px bg-surface-dim" />
      </div>
    );
  }

  return (
    <hr
      className={cn("w-full border-t border-surface-dim my-4", className)}
      role="separator"
      {...props}
    />
  );
}

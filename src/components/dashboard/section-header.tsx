import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  actionHref,
  actionLabel = "View All",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 pb-3 border-b border-surface-dim", className)}>
      <div>
        <h2 className="font-heading text-base font-bold text-on-surface">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-neutral font-body mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1 text-xs font-heading font-semibold text-brand-secondary hover:text-brand-primary transition-colors shrink-0"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

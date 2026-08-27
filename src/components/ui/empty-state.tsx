import React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-surface-dim bg-white shadow-sm space-y-3 font-body",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-low border border-surface-dim text-brand-secondary">
        <Icon className="h-6 w-6" />
      </div>

      <div className="max-w-sm space-y-1">
        <h3 className="font-heading text-base font-bold text-on-surface">{title}</h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-neutral leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionLabel && (onAction || actionHref) && (
        <div className="pt-2">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary" size="sm">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

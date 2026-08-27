import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: "up" | "down" | "neutral";
  };
  timeframe?: string;
  icon: React.ElementType;
  iconVariant?: "primary" | "secondary" | "success" | "warning" | "info";
  className?: string;
}

const variantIconStyles = {
  primary: "bg-brand-primary/10 text-brand-primary",
  secondary: "bg-brand-secondary/10 text-brand-secondary",
  success: "bg-status-success/10 text-status-success",
  warning: "bg-status-warning/10 text-status-warning",
  info: "bg-status-info/10 text-status-info",
};

export function StatCard({
  title,
  value,
  change,
  timeframe = "vs last month",
  icon: Icon,
  iconVariant = "primary",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("border border-surface-dim bg-white p-5 shadow-stitch-card", className)}>
      <CardContent className="p-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-heading font-semibold uppercase tracking-wider text-slate-neutral">
            {title}
          </span>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", variantIconStyles[iconVariant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">
            {value}
          </div>

          {change && (
            <div className="flex items-center gap-1.5 pt-1 text-xs font-body">
              <span
                className={cn(
                  "inline-flex items-center font-bold",
                  change.trend === "up" && "text-status-success",
                  change.trend === "down" && "text-status-error",
                  change.trend === "neutral" && "text-slate-neutral"
                )}
              >
                {change.trend === "up" && <TrendingUp className="h-3.5 w-3.5 mr-0.5" />}
                {change.trend === "down" && <TrendingDown className="h-3.5 w-3.5 mr-0.5" />}
                {change.value}
              </span>
              <span className="text-slate-neutral/70 font-caption">{timeframe}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

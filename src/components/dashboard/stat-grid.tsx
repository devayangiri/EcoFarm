import React from "react";
import { cn } from "@/lib/utils";

export interface StatGridProps {
  columns?: 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export function StatGrid({ columns = 4, children, className }: StatGridProps) {
  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-4", colClass, className)}>
      {children}
    </div>
  );
}

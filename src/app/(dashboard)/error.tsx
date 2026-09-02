"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard render error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-4 border border-surface-dim bg-white shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-error/10 text-status-error">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-on-surface">
            Something went wrong loading your dashboard.
          </h2>
          <p className="text-xs text-slate-neutral">
            We encountered a temporary problem rendering this dashboard view. Your account and data remain safe.
          </p>
        </div>
        <Button
          onClick={() => reset()}
          variant="primary"
          size="md"
          className="w-full gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Retry</span>
        </Button>
      </Card>
    </div>
  );
}

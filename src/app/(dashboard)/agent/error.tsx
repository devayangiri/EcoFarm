"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, RotateCcw } from "lucide-react";

export default function AgentDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Agent dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-4 border border-surface-dim bg-white shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-bold text-on-surface">
            Something went wrong loading your dashboard.
          </h2>
          <p className="text-xs text-slate-neutral">
            We encountered a temporary problem loading your field agent operations. Please retry.
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

"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wrench, RotateCcw, Home } from "lucide-react";

export default function ProviderDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Provider dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-5 border border-surface-dim bg-white shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          <Wrench className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-heading text-lg font-bold text-on-surface">
            Something went wrong loading your dashboard.
          </h2>
          <p className="text-xs text-slate-neutral leading-relaxed">
            We encountered a temporary problem loading your service provider operations. You can retry loading or return to the main platform.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="primary"
            size="md"
            className="w-full gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
          <Link href="/" className="w-full">
            <Button variant="outline" size="md" className="w-full gap-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

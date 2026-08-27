import React from "react";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketplaceShell } from "@/components/public/marketplace-shell";

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: { orderNumber?: string };
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  return (
    <MarketplaceShell>
      <div className="py-12 max-w-xl mx-auto text-center space-y-6">
        <Card className="border border-surface-dim bg-white shadow-sm p-8 space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-success/10 text-status-success mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-extrabold text-on-surface">
              Order Confirmed & Locked!
            </h1>
            <p className="text-xs text-slate-neutral leading-relaxed">
              Your wholesale purchase order has been successfully generated and dispatched to the respective producers.
            </p>
            {searchParams.orderNumber && (
              <div className="p-3 bg-surface-low rounded border border-surface-dim inline-block font-mono text-sm font-bold text-brand-primary">
                Order ID: {searchParams.orderNumber}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-surface-dim">
            <Link href="/buyer/orders" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full" leftIcon={<Package className="h-4 w-4" />}>
                View Order History
              </Button>
            </Link>

            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </MarketplaceShell>
  );
}
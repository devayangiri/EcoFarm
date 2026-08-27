"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sprout, Waves, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-low via-surface to-white py-12 sm:py-20 border-b border-surface-dim">
      <div className="max-w-stitch-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2">
            <Badge variant="primary" size="md">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified High-Trust B2B Ecosystem</span>
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="font-display">
            Connect. Trade. Grow.
          </h1>

          <p className="font-body-lg text-slate-neutral max-w-2xl mx-auto">
            The dedicated digital business network and marketplace connecting <span className="font-semibold text-brand-primary">Farmers</span>, <span className="font-semibold text-brand-secondary">Aquaculture Producers</span>, <span className="font-semibold text-on-surface">Commercial Buyers</span>, and <span className="font-semibold text-on-surface">Service Providers</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                <span>Join the Network</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Marketplace
              </Button>
            </Link>
          </div>

          {/* Trust Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-surface-dim/80 text-left">
            <div className="p-3 bg-white rounded-md border border-surface-dim">
              <div className="flex items-center gap-2 text-brand-primary mb-1">
                <Sprout className="h-4 w-4" />
                <span className="font-heading font-bold text-base sm:text-lg">500+ MT</span>
              </div>
              <p className="text-[11px] text-slate-neutral font-body">Agricultural Produce</p>
            </div>

            <div className="p-3 bg-white rounded-md border border-surface-dim">
              <div className="flex items-center gap-2 text-brand-secondary mb-1">
                <Waves className="h-4 w-4" />
                <span className="font-heading font-bold text-base sm:text-lg">100% Live</span>
              </div>
              <p className="text-[11px] text-slate-neutral font-body">Freshwater Fish Logistics</p>
            </div>

            <div className="p-3 bg-white rounded-md border border-surface-dim">
              <div className="flex items-center gap-2 text-status-success mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span className="font-heading font-bold text-base sm:text-lg">KYB / KYC</span>
              </div>
              <p className="text-[11px] text-slate-neutral font-body">Direct Farmer Verification</p>
            </div>

            <div className="p-3 bg-white rounded-md border border-surface-dim">
              <div className="flex items-center gap-2 text-on-surface mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="font-heading font-bold text-base sm:text-lg">0% Fraud</span>
              </div>
              <p className="text-[11px] text-slate-neutral font-body">Escrow & Secure Payments</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

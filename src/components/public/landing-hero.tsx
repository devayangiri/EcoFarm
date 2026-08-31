"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sprout, Waves, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-low via-surface to-white py-16 sm:py-24 lg:py-28 border-b border-surface-dim">
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-stitch-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Top Pill */}
          <div className="inline-flex items-center justify-center">
            <Badge variant="primary" size="md" className="px-3.5 py-1 text-xs gap-1.5 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-brand-primary" />
              <span>Verified High-Trust B2B Ecosystem</span>
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-on-surface leading-[1.15]">
            Connect. <span className="text-brand-primary">Trade.</span> <span className="text-brand-secondary">Grow.</span>
          </h1>

          <p className="font-body text-base sm:text-lg md:text-xl text-slate-neutral max-w-3xl mx-auto leading-relaxed">
            The dedicated digital business network and marketplace connecting <span className="font-semibold text-brand-primary">Farmers</span>, <span className="font-semibold text-brand-secondary">Aquaculture Producers</span>, <span className="font-semibold text-on-surface">Commercial Buyers</span>, and <span className="font-semibold text-on-surface">Service Providers</span> across India.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto min-h-[48px] px-8 text-base font-semibold shadow-md gap-2">
                <span>Join the Network</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto min-h-[48px] px-8 text-base font-semibold bg-white hover:bg-surface-low border-surface-dim">
                Explore Marketplace
              </Button>
            </Link>
          </div>

          {/* Trust Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-12 border-t border-surface-dim/80 text-left">
            <div className="p-4 bg-white rounded-lg border border-surface-dim shadow-stitch-card">
              <div className="flex items-center gap-2 text-brand-primary mb-1">
                <Sprout className="h-5 w-5" />
                <span className="font-heading font-bold text-lg sm:text-xl">500+ MT</span>
              </div>
              <p className="text-xs text-slate-neutral font-body font-medium">Agricultural Produce</p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-surface-dim shadow-stitch-card">
              <div className="flex items-center gap-2 text-brand-secondary mb-1">
                <Waves className="h-5 w-5" />
                <span className="font-heading font-bold text-lg sm:text-xl">100% Live</span>
              </div>
              <p className="text-xs text-slate-neutral font-body font-medium">Freshwater Fish Logistics</p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-surface-dim shadow-stitch-card">
              <div className="flex items-center gap-2 text-status-success mb-1">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-heading font-bold text-lg sm:text-xl">KYB / KYC</span>
              </div>
              <p className="text-xs text-slate-neutral font-body font-medium">Direct Farmer Verification</p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-surface-dim shadow-stitch-card">
              <div className="flex items-center gap-2 text-on-surface mb-1">
                <TrendingUp className="h-5 w-5" />
                <span className="font-heading font-bold text-lg sm:text-xl">0% Fraud</span>
              </div>
              <p className="text-xs text-slate-neutral font-body font-medium">Escrow & Secure Payments</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

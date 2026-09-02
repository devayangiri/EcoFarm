"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sprout,
  Waves,
  Building2,
  Store,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-low via-surface to-white py-14 sm:py-20 lg:py-24 border-b border-surface-dim">
      {/* Background Ambience / Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#064e3b_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 right-1/4 -translate-y-1/2 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 translate-y-1/2 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-stitch-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 sm:space-y-8 max-w-3xl mx-auto">
          {/* Dual-Sector Platform Pill */}
          <div className="inline-flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-surface-dim bg-white shadow-sm text-xs font-semibold text-brand-primary">
              <span className="flex h-2 w-2 rounded-full bg-status-success"></span>
              <span>Agriculture + Aquaculture B2B Operating Platform</span>
            </div>
          </div>

          {/* Core Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-on-surface leading-[1.15]">
            Connect. <span className="text-brand-primary">Trade.</span>{" "}
            <span className="text-brand-secondary">Grow.</span>
          </h1>

          {/* Supporting Statement */}
          <p className="font-body text-base sm:text-lg md:text-xl text-slate-neutral max-w-2xl mx-auto leading-relaxed">
            A trusted digital business network connecting farmers, aquaculture producers, commercial buyers and service providers.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto min-h-[48px] px-8 text-sm sm:text-base font-semibold shadow-md gap-2.5 rounded-lg"
              >
                <span>Join the Network</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-h-[48px] px-8 text-sm sm:text-base font-semibold bg-white hover:bg-surface-low border-surface-dim text-on-surface rounded-lg"
              >
                Explore Marketplace
              </Button>
            </Link>
          </div>

          {/* Verified Capabilities Strip (Zero Fake Numbers) */}
          <div className="pt-8 sm:pt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-slate-neutral/90">
            <div className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
              <span>Direct Wholesale Commodity Discovery</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-secondary shrink-0" />
              <span>Multi-Sector Producer Network</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
              <span>Equipments & Agricultural Services</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

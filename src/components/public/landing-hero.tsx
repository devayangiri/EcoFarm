"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Sprout,
  Waves,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGE_ASSETS } from "@/config/image-assets";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface-low via-surface to-white py-12 sm:py-16 lg:py-20 border-b border-surface-dim">
      {/* Background Ambience / Subtle Grid Pattern */}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Platform Identity & Core Messaging */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Dual-Sector Platform Pill */}
            <div className="inline-flex items-center justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-surface-dim bg-white shadow-xs text-xs font-semibold text-brand-primary">
                <span className="flex h-2 w-2 rounded-full bg-status-success animate-pulse"></span>
                <span>Agriculture + Aquaculture Digital Platform</span>
              </div>
            </div>

            {/* Core Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-on-surface leading-[1.12]">
              Connect. <span className="text-brand-primary">Trade.</span>{" "}
              <span className="text-brand-secondary">Grow.</span>
            </h1>

            {/* Supporting Statement */}
            <p className="font-body text-base sm:text-lg md:text-xl text-slate-neutral max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              A digital platform connecting producers, buyers and agricultural businesses.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto min-h-[48px] px-8 text-sm sm:text-base font-semibold shadow-md gap-2.5 rounded-lg"
                >
                  <span>Join EcoFarm</span>
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

            {/* Verified Capabilities Strip */}
            <div className="pt-4 sm:pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs font-medium text-slate-neutral/90">
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
                <span>Direct Wholesale Discovery</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-secondary shrink-0" />
                <span>Verified Producer Network</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
                <span>Equipment & Cold Storage</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Desktop Agriculture Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Agriculture Hero Photograph */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-surface-dim bg-surface-low group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={IMAGE_ASSETS.hero.agriculture.src}
                  alt={IMAGE_ASSETS.hero.agriculture.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Bottom Caption Overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                    <Sprout className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Commercial Farm Harvests</span>
                  </div>
                  <p className="text-[11px] text-white/70 font-body">Direct farm-gate supply lots across India</p>
                </div>

                {/* Top-Right Trust Badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-md px-2.5 py-1 text-[11px] font-semibold text-brand-primary shadow-sm flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
                  <span>Verified Platform</span>
                </div>
              </div>

              {/* Secondary Floating Aquaculture Visual Card */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white rounded-xl p-2.5 shadow-xl border border-surface-dim flex items-center gap-3 max-w-[240px] sm:max-w-[260px] animate-fadeIn">
                <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0 border border-surface-dim">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={IMAGE_ASSETS.hero.aquaculture.src}
                    alt={IMAGE_ASSETS.hero.aquaculture.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                    <Waves className="h-3 w-3 shrink-0" />
                    <span className="truncate">Aquaculture Sector</span>
                  </div>
                  <p className="text-xs font-heading font-bold text-on-surface truncate">
                    Freshwater Harvests
                  </p>
                  <p className="text-[10px] text-slate-neutral truncate">Live pond & hatchery lots</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


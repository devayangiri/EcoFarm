"use client";

import React from "react";
import Link from "next/link";
import { Sprout, Waves, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGE_ASSETS } from "@/config/image-assets";

export function DualSectorShowcase() {
  return (
    <section className="py-14 sm:py-18 lg:py-22 bg-gradient-to-b from-white via-surface-low to-white border-b border-surface-dim">
      <div className="max-w-stitch-container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs font-semibold text-brand-primary">
            <span>Integrated Dual Economy</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface">
            Two Pillars. One Unified Operating Platform.
          </h2>
          <p className="text-xs sm:text-sm text-slate-neutral font-body max-w-2xl mx-auto">
            EcoFarm powers wholesale discovery and transparent trade across traditional agricultural crops and modern freshwater aquaculture systems.
          </p>
        </div>

        {/* 2-Column Split Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agriculture Pillar Card */}
          <div className="group relative rounded-3xl overflow-hidden border border-surface-dim bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-emerald-700/40 flex flex-col justify-between">
            {/* Background Photographic Banner */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-emerald-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGE_ASSETS.showcase.agriculture.src}
                alt={IMAGE_ASSETS.showcase.agriculture.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#064e3b] via-[#064e3b]/50 to-transparent" />
              
              {/* Pillar Header Badge */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                <Sprout className="h-4 w-4 text-emerald-400" />
                <span>Agriculture Production</span>
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <div className="text-[11px] uppercase tracking-widest text-emerald-300 font-semibold">
                  Produce &rarr; Connect &rarr; Sell
                </div>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mt-1">
                  Crops, Cereals, Horticulture & Seeds
                </h3>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between bg-white">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-slate-neutral font-body leading-relaxed">
                  Direct commercial access for farmers cultivating paddy, wheat, pulses, fruits and vegetables. Eliminate predatory intermediaries with transparent wholesale pricing.
                </p>

                <ul className="space-y-2 text-xs text-slate-neutral font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
                    <span>Real-time harvest listings with farm-gate lot weights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
                    <span>Direct connection to licensed institutional buyers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
                    <span>On-demand tractor rentals & local logistics support</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-surface-dim flex items-center justify-between">
                <Link href="/marketplace?sector=AGRICULTURE" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto gap-2 bg-[#064e3b] hover:bg-[#064e3b]/90 text-white shadow-sm"
                  >
                    <span>Explore Agriculture</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-neutral">
                  Wholesale Farm Gate
                </span>
              </div>
            </div>
          </div>

          {/* Aquaculture Pillar Card */}
          <div className="group relative rounded-3xl overflow-hidden border border-surface-dim bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-cyan-600/40 flex flex-col justify-between">
            {/* Background Photographic Banner */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-cyan-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGE_ASSETS.showcase.aquaculture.src}
                alt={IMAGE_ASSETS.showcase.aquaculture.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0891b2] via-[#0891b2]/50 to-transparent" />
              
              {/* Pillar Header Badge */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                <Waves className="h-4 w-4 text-cyan-300" />
                <span>Freshwater Aquaculture</span>
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <div className="text-[11px] uppercase tracking-widest text-cyan-200 font-semibold">
                  Produce &rarr; Connect &rarr; Sell
                </div>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mt-1">
                  Inland Fisheries, Hatcheries & Biofloc
                </h3>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between bg-white">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-slate-neutral font-body leading-relaxed">
                  Specialized platform architecture for inland fish farmers, hatchery operators and shrimp producers. Coordinate live-fish transit and connect with regional fish mandis.
                </p>

                <ul className="space-y-2 text-xs text-slate-neutral font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-secondary shrink-0" />
                    <span>Live pond batch listings with certified average weights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-secondary shrink-0" />
                    <span>Direct wholesale trade for Rohu, Catla, Pangasius & Prawns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-secondary shrink-0" />
                    <span>Specialized aeration equipment & cold transport bookings</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-surface-dim flex items-center justify-between">
                <Link href="/marketplace?sector=AQUACULTURE" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto gap-2 bg-[#0891b2] hover:bg-[#0891b2]/90 text-white shadow-sm"
                  >
                    <span>Explore Aquaculture</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-neutral">
                  Inland Fisheries
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

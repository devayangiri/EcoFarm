"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { IMAGE_ASSETS } from "@/config/image-assets";

export function CategoryDiscovery() {
  const categories = Object.values(IMAGE_ASSETS.categories);

  return (
    <section className="py-14 sm:py-18 lg:py-20 bg-surface border-b border-surface-dim">
      <div className="max-w-stitch-container mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-primary">
              <Layers className="h-4 w-4" />
              <span>Category Directory</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface">
              Explore Agriculture & Aquaculture Sectors
            </h2>
            <p className="text-xs sm:text-sm text-slate-neutral max-w-2xl font-body">
              Discover verified wholesale commodities, harvest batches, farm machinery, and post-harvest storage services.
            </p>
          </div>

          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors shrink-0"
          >
            <span>All Categories</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group relative rounded-2xl overflow-hidden border border-surface-dim bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-brand-primary/40 hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Category Image Header */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-low">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.src}
                  alt={cat.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                {/* Badge Overlay */}
                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <h3 className="font-heading text-sm sm:text-base font-bold text-white line-clamp-1">
                    {cat.title}
                  </h3>
                </div>
              </div>

              {/* Card Footer Detail */}
              <div className="p-3 sm:p-4 flex items-center justify-between gap-2 bg-white">
                <p className="text-[11px] sm:text-xs text-slate-neutral line-clamp-1 font-body">
                  {cat.desc}
                </p>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-low text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors shrink-0">
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

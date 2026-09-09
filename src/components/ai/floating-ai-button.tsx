"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export function FloatingAIButton() {
  const pathname = usePathname();

  // Hide the floating button when already on the AI chat page
  if (pathname?.startsWith("/ai")) {
    return null;
  }

  return (
    <aside
      aria-label="EcoFarm AI Assistant quick launcher"
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 print:hidden select-none"
    >
      <Link
        href="/ai"
        className="group relative flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-brand-primary via-emerald-600 to-teal-700 text-white font-semibold text-xs sm:text-sm shadow-[0_4px_16px_rgba(22,101,52,0.35)] hover:shadow-[0_6px_22px_rgba(22,101,52,0.45)] hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        aria-label="Open EcoFarm AI Assistant"
      >
        {/* Pulsing online status ring */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200" />
        </span>

        {/* AI Sparkles Icon */}
        <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-amber-300 animate-pulse" />

        {/* Label */}
        <span className="font-heading tracking-tight">EcoFarm AI</span>
      </Link>
    </aside>
  );
}

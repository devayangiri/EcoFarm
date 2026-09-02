import React from "react";
import Link from "next/link";
import { Sprout, Waves, Smartphone, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-dim bg-white text-slate-neutral font-body">
      {/* Top Main Navigation Grid */}
      <div className="mx-auto max-w-stitch-container px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
              aria-label="Agri-Aqua Network Home"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary text-white shadow-sm">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-heading text-lg font-bold tracking-tight text-brand-primary">
                  <span>Agri-Aqua</span>
                  <Waves className="h-4 w-4 text-brand-secondary" />
                  <span className="text-on-surface">Network</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-neutral/70">
                  B2B Operating Platform
                </span>
              </div>
            </Link>

            <p className="font-heading font-semibold text-sm text-on-surface">
              Connect. Trade. Grow.
            </p>

            <p className="text-xs leading-relaxed text-slate-neutral/80">
              Connecting farmers, aquaculture producers, commercial buyers, and service providers across India into an integrated digital business ecosystem.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-surface-dim bg-surface-low px-3 py-1 text-[11px] font-medium text-brand-primary">
              <span className="flex h-2 w-2 rounded-full bg-status-success"></span>
              <span>Agriculture + Aquaculture Platform</span>
            </div>
          </div>

          {/* Column 2: For Business */}
          <div className="space-y-3">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-on-surface">
              For Business
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/marketplace"
                  className="transition-colors hover:text-brand-primary hover:underline"
                >
                  Commodity Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="/network"
                  className="transition-colors hover:text-brand-primary hover:underline"
                >
                  Business Network Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="transition-colors hover:text-brand-primary hover:underline"
                >
                  Services & Machinery
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="transition-colors hover:text-brand-primary hover:underline"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Users */}
          <div className="space-y-3">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-on-surface">
              Ecosystem Roles
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/register?role=FARMER"
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-primary hover:underline"
                >
                  <span>Farmers & Producers</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/register?role=BUYER"
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-primary hover:underline"
                >
                  <span>Commercial Buyers</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/register?role=SERVICE_PROVIDER"
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-primary hover:underline"
                >
                  <span>Service Providers</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link
                  href="/register?role=AGENT"
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-primary hover:underline"
                >
                  <span>Field Agents</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company & Trust */}
          <div className="space-y-3">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-on-surface">
              Company & Trust
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://ayangiri.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-primary hover:underline"
                >
                  <span>About Agri-Aqua</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://ayangiri.com/contact/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-primary hover:underline"
                >
                  <span>Contact Team</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://ayangiri.com/privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-primary hover:underline"
                >
                  <span>Privacy Policy</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://ayangiri.com/terms/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-brand-primary hover:underline"
                >
                  <span>Terms of Service</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <Link
                  href="/network"
                  className="transition-colors hover:text-brand-primary hover:underline"
                >
                  Help & Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Download the App (Coming Soon) */}
          <div className="space-y-3">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-on-surface">
              Mobile Application
            </h3>
            <p className="text-xs text-slate-neutral/80 leading-relaxed">
              Native Android & iOS mobile applications for field trading and harvest logging are in development.
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Google Play Disabled Badge */}
              <div
                className="group relative flex items-center gap-3 rounded-lg border border-surface-dim bg-surface-low/70 px-3 py-2 cursor-not-allowed select-none opacity-80"
                aria-label="Google Play App (Coming Soon)"
                title="Android application coming soon"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-600">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">
                    Android App
                  </span>
                  <span className="text-xs font-semibold font-heading text-on-surface">
                    Google Play
                  </span>
                </div>
                <span className="ml-auto rounded bg-brand-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-brand-secondary">
                  Coming Soon
                </span>
              </div>

              {/* Apple App Store Disabled Badge */}
              <div
                className="group relative flex items-center gap-3 rounded-lg border border-surface-dim bg-surface-low/70 px-3 py-2 cursor-not-allowed select-none opacity-80"
                aria-label="Apple App Store (Coming Soon)"
                title="iOS application coming soon"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-200 text-slate-600">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">
                    iOS App
                  </span>
                  <span className="text-xs font-semibold font-heading text-on-surface">
                    App Store
                  </span>
                </div>
                <span className="ml-auto rounded bg-brand-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-brand-secondary">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-surface-dim pt-8 sm:flex-row text-xs text-slate-neutral/70">
          <p>© 2026 Agri-Aqua Network. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <Link href="/marketplace" className="hover:text-brand-primary transition-colors">
              Marketplace
            </Link>
            <Link href="/network" className="hover:text-brand-primary transition-colors">
              Directory
            </Link>
            <Link href="/services" className="hover:text-brand-primary transition-colors">
              Services
            </Link>
            <a
              href="https://ayangiri.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-primary transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://ayangiri.com/terms/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-primary transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

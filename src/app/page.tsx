import React from "react";
import Link from "next/link";
import {
  Sprout,
  Waves,
  ArrowRight,
  ShieldCheck,
  Building2,
  Store,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  const pillars = [
    {
      title: "Direct B2B Marketplace",
      description: "Trade agricultural harvests, seafood, inputs, and produce with verified bulk buyers and producers.",
      icon: Store,
      badge: "Marketplace",
      color: "text-brand-primary",
      bg: "bg-brand-primary/10",
    },
    {
      title: "Business Network",
      description: "Connect with verified agricultural enterprises, exporters, food processors, and cold-chain suppliers.",
      icon: Building2,
      badge: "Ecosystem",
      color: "text-brand-secondary",
      bg: "bg-brand-secondary/10",
    },
    {
      title: "Agri & Aqua Services",
      description: "On-demand farm machinery rental, soil/water lab testing, cold storage, and logistics support.",
      icon: Wrench,
      badge: "Operations",
      color: "text-brand-primary",
      bg: "bg-brand-primary/10",
    },
  ];

  return (
    <AppShell currentPath="/">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-surface-low to-surface py-12 md:py-20 border-b border-surface-dim">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 border border-surface-dim">
                <Badge variant="primary">Platform Foundation</Badge>
                <span className="text-xs font-semibold text-slate-neutral">
                  Agri-Aqua Network v0.1.0
                </span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-[1.15]">
                Connecting the <span className="text-brand-primary">Agriculture</span> &{" "}
                <span className="text-brand-secondary">Aquaculture</span> Ecosystem.
              </h1>

              <p className="font-heading text-xl font-semibold text-brand-secondary italic">
                Connect. Trade. Grow.
              </p>

              <p className="font-body text-base sm:text-lg text-slate-neutral leading-relaxed max-w-2xl">
                A high-trust digital business network bridging farmers, commercial buyers, field agents, and service providers with transparent pricing, verified identities, and reliable trade settlement.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button size="lg" variant="primary" className="gap-2 shadow-md">
                  <span>Explore Marketplace</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="secondary">
                  Join Business Network
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-slate-neutral">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-status-success" />
                  <span>Verified Farmers & Businesses</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-status-success" />
                  <span>Escrow & Multi-Vendor Orders</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-status-success" />
                  <span>Dedicated Field Agent Support</span>
                </div>
              </div>
            </div>

            {/* Right Card / Interactive Preview */}
            <div className="lg:col-span-5">
              <Card className="border-surface-dim bg-white shadow-stitch-card">
                <CardHeader className="bg-surface-low border-b border-surface-dim">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-brand-primary" />
                      <CardTitle className="text-base font-semibold">
                        Network Overview
                      </CardTitle>
                    </div>
                    <Badge variant="success">Phase 1 Active</Badge>
                  </div>
                  <CardDescription>
                    Multi-Role Architecture Ready for Modules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border border-surface-dim bg-surface-bright p-3">
                      <div className="text-xs font-medium text-slate-neutral">Primary Sector</div>
                      <div className="mt-1 font-heading text-lg font-bold text-brand-primary">
                        Agriculture
                      </div>
                      <div className="text-[11px] text-slate-neutral">Crops, Seeds, Inputs</div>
                    </div>
                    <div className="rounded-md border border-surface-dim bg-surface-bright p-3">
                      <div className="text-xs font-medium text-slate-neutral">Aquatic Sector</div>
                      <div className="mt-1 font-heading text-lg font-bold text-brand-secondary">
                        Aquaculture
                      </div>
                      <div className="text-[11px] text-slate-neutral">Shrimp, Fish, Hatcheries</div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md bg-surface-low p-3 text-xs text-slate-neutral">
                    <div className="flex justify-between">
                      <span className="font-semibold text-on-surface">System Health:</span>
                      <span className="text-status-success font-semibold">Operational (200 OK)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-on-surface">Design Tokens:</span>
                      <span>Stitch #064e3b / #0891b2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-on-surface">API Endpoint:</span>
                      <code className="text-[11px] bg-white px-1.5 py-0.5 rounded border border-surface-dim">/api/health</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars Section */}
      <section className="py-16 bg-surface">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-on-surface">
              Three Pillars of the Agri-Aqua Ecosystem
            </h2>
            <p className="mt-2 text-sm text-slate-neutral font-body">
              Designed to support end-to-end commercial operations across crops and marine farming.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card key={pillar.title} className="hover:border-brand-secondary/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-md ${pillar.bg} ${pillar.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="default">{pillar.badge}</Badge>
                    </div>
                    <CardTitle className="text-lg">{pillar.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">{pillar.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

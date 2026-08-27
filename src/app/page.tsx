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
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LandingHero } from "@/components/public/landing-hero";
import { ProductCard } from "@/components/cards/product-card";
import { SectionHeader } from "@/components/dashboard/section-header";

export default function HomePage() {
  const featuredProducts = [
    {
      id: "feat-1",
      slug: "swarna-paddy-grain-grade-a-purba-bardhaman",
      title: "Swarna High-Yield Paddy Grain (Grade A)",
      sector: "AGRICULTURE" as const,
      category: "Cereals & Grains",
      variety: "Swarna (MTU 7029)",
      pricePerUnit: 2180.0,
      unit: "QUINTAL",
      availableStock: 500,
      sellerName: "Ramesh Kumar",
      isSellerVerified: true,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
    },
    {
      id: "feat-2",
      slug: "live-premium-rohu-freshwater-fish",
      title: "Live Premium Rohu Fish (Labeo rohita 1.5kg+)",
      sector: "AQUACULTURE" as const,
      category: "Freshwater Fish",
      variety: "Rohu (Labeo rohita)",
      pricePerUnit: 185.0,
      unit: "KG",
      availableStock: 8000,
      sellerName: "Ramesh Kumar",
      isSellerVerified: true,
      locationDistrict: "Purba Bardhaman",
      locationState: "West Bengal",
      imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600",
    },
    {
      id: "feat-3",
      slug: "jyoti-grade-1-cold-store-potato-singur",
      title: "Jyoti Grade-1 Cold-Store Seed Potato",
      sector: "AGRICULTURE" as const,
      category: "Root Vegetables",
      variety: "Kufri Jyoti",
      pricePerUnit: 1450.0,
      unit: "QUINTAL",
      availableStock: 1200,
      sellerName: "Animesh Mondal",
      isSellerVerified: true,
      locationDistrict: "Hooghly",
      locationState: "West Bengal",
      imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600",
    },
  ];

  const pillars = [
    {
      title: "Direct B2B Marketplace",
      description: "Trade agricultural harvests, seafood, inputs, and produce with verified bulk buyers and producers.",
      icon: Store,
      badge: "Marketplace",
      color: "text-brand-primary",
      bg: "bg-brand-primary/10",
      href: "/marketplace",
    },
    {
      title: "Business Network",
      description: "Connect with verified agricultural enterprises, exporters, food processors, and cold-chain suppliers.",
      icon: Building2,
      badge: "Ecosystem",
      color: "text-brand-secondary",
      bg: "bg-brand-secondary/10",
      href: "/register",
    },
    {
      title: "Agri & Aqua Services",
      description: "On-demand farm machinery rental, soil/water lab testing, cold storage, and logistics support.",
      icon: Wrench,
      badge: "Operations",
      color: "text-brand-primary",
      bg: "bg-brand-primary/10",
      href: "/marketplace",
    },
  ];

  return (
    <AppShell currentPath="/">
      {/* Stitch Landing Hero */}
      <LandingHero />

      {/* Featured Verified Commodities */}
      <section className="py-12 bg-white border-b border-surface-dim">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8 space-y-6">
          <SectionHeader
            title="Featured Harvests & Aquaculture"
            subtitle="Verified wholesale listings with guaranteed quantity and direct producer pricing."
            actionHref="/marketplace"
            actionLabel="View All 500+ Commodities"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section className="py-14 bg-surface">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="primary" size="md">Integrated B2B Ecosystem</Badge>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-on-surface">
              Everything Needed for Modern Agri-Aqua Trade
            </h2>
            <p className="text-sm text-slate-neutral font-body">
              Designed to support end-to-end commercial operations across crops and marine farming.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card key={pillar.title} className="hover:border-brand-secondary/40 transition-all hover:shadow-md flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-md ${pillar.bg} ${pillar.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="neutral" size="sm">{pillar.badge}</Badge>
                    </div>
                    <CardTitle className="text-lg">{pillar.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">{pillar.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link
                      href={pillar.href}
                      className="inline-flex items-center gap-1 text-xs font-heading font-semibold text-brand-secondary hover:text-brand-primary transition-colors"
                    >
                      <span>Explore {pillar.title}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

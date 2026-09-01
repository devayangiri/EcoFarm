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
import { getCurrentUser } from "@/lib/rbac";

import { MarketplaceService } from "@/services/marketplace.service";
import { MarketplaceSearchSchema } from "@/lib/validators/marketplace.schema";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getCurrentUser();

  let featuredProducts: any[] = [];
  let isDbUnavailable = false;

  try {
    const searchParams = MarketplaceSearchSchema.parse({
      page: 1,
      pageSize: 3,
      sortBy: "newest",
    });
    const searchResult = await MarketplaceService.searchProducts(searchParams);
    featuredProducts = searchResult.items || [];
  } catch (err: any) {
    isDbUnavailable = true;
    console.error("[Homepage] Featured products query failed:", {
      route: "/",
      errorCategory: "DATABASE_UNAVAILABLE",
      message: err instanceof Error ? err.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }

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
      href: "/network",
    },
    {
      title: "Agri & Aqua Services",
      description: "On-demand farm machinery rental, soil/water lab testing, cold storage, and logistics support.",
      icon: Wrench,
      badge: "Operations",
      color: "text-brand-primary",
      bg: "bg-brand-primary/10",
      href: "/services",
    },
  ];

  return (
    <AppShell
      currentPath="/"
      userRole={session?.role || "Guest"}
      userName={session?.fullName || "Welcome"}
    >
      {/* Stitch Landing Hero */}
      <LandingHero />

      {/* Featured Verified Commodities */}
      <section className="py-12 bg-white border-b border-surface-dim">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8 space-y-6">
          <SectionHeader
            title="Featured Harvests & Aquaculture"
            subtitle="Verified wholesale listings with direct producer pricing."
            actionHref="/marketplace"
            actionLabel="Explore All Commodities"
          />

          {isDbUnavailable ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-6 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-800 font-heading font-semibold text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Commodity Catalog Temporarily Unavailable</span>
              </div>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Unable to load live listings at this moment. Our team has been alerted. Please explore the directory or try refreshing.
              </p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  title={p.title}
                  sector={p.sector}
                  category={p.category}
                  variety={p.variety}
                  pricePerUnit={p.pricePerUnit}
                  unit={p.unit}
                  availableStock={p.availableStock}
                  sellerName={p.seller?.fullName || p.sellerName || "Verified Producer"}
                  isSellerVerified={p.seller?.isVerified ?? p.isSellerVerified ?? true}
                  locationDistrict={p.locationDistrict}
                  locationState={p.locationState}
                  imageUrl={p.imageUrl}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-surface-dim p-8 text-center bg-surface/50 space-y-3">
              <Sprout className="h-10 w-10 text-slate-neutral/40 mx-auto" />
              <div className="space-y-1">
                <p className="font-heading font-semibold text-on-surface text-base">
                  No Featured Commodities Listed Yet
                </p>
                <p className="text-xs text-slate-neutral max-w-md mx-auto">
                  Verified wholesale agricultural and aquaculture harvests will appear here as soon as registered producers list their inventory.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <Link href="/marketplace">
                  <Button variant="outline" size="sm">Explore Marketplace</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">List Your Harvest</Button>
                </Link>
              </div>
            </div>
          )}
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

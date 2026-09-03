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
  Search,
  Users,
  Handshake,
  TrendingUp,
  Briefcase,
  Layers,
  ChevronRight,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LandingHero } from "@/components/public/landing-hero";
import { GlobalMarketplaceSearch } from "@/components/public/global-marketplace-search";
import { CategoryDiscovery } from "@/components/public/category-discovery";
import { DualSectorShowcase } from "@/components/public/dual-sector-showcase";
import { ProductCard } from "@/components/cards/product-card";
import { NetworkCard } from "@/components/network/network-card";
import { ServiceCard } from "@/components/services/service-card";
import { getCurrentUser } from "@/lib/rbac";

import { MarketplaceService } from "@/services/marketplace.service";
import { NetworkService } from "@/services/network.service";
import { ServiceService } from "@/services/service.service";
import { MarketplaceSearchSchema } from "@/lib/validators/marketplace.schema";
import { NetworkDirectorySearchSchema } from "@/lib/validators/network.schema";
import { ServiceDirectorySearchSchema } from "@/lib/validators/service.schema";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getCurrentUser();

  let featuredProducts: any[] = [];
  let networkProfiles: any[] = [];
  let serviceListings: any[] = [];

  // Query live database for real data across the three core catalog domains
  try {
    const productParams = MarketplaceSearchSchema.parse({
      page: 1,
      pageSize: 3,
      sortBy: "newest",
    });
    const pResult = await MarketplaceService.searchProducts(productParams);
    featuredProducts = pResult.items || [];
  } catch (err) {
    console.error("[Homepage] Products query:", err);
  }

  try {
    const networkParams = NetworkDirectorySearchSchema.parse({
      page: 1,
      pageSize: 3,
      sortBy: "newest",
    });
    const nResult = await NetworkService.searchDirectory(networkParams, session?.userId);
    networkProfiles = nResult.items || [];
  } catch (err) {
    console.error("[Homepage] Network query:", err);
  }

  try {
    const serviceParams = ServiceDirectorySearchSchema.parse({
      page: 1,
      pageSize: 3,
      sortBy: "newest",
    });
    const sResult = await ServiceService.searchServices(serviceParams);
    serviceListings = sResult.items || [];
  } catch (err) {
    console.error("[Homepage] Services query:", err);
  }

  // Filter out any dev/test/demo accounts from public homepage previews (Phase 0 & Phase 8)
  const genuineProfiles = networkProfiles.filter(
    (p) => !/test|demo|e2e|ayan/i.test((p.displayName || "") + " " + (p.headline || ""))
  );

  const genuineServices = serviceListings.filter(
    (s) => !/test|demo|e2e|ayan/i.test((s.title || "") + " " + (s.description || "") + " " + (s.provider?.businessName || ""))
  );

  // Capability Pillars (Truthful description of current platform capabilities)
  const capabilityPillars = [
    {
      title: "Verified Participants",
      description: "Direct business accounts for producers, wholesale traders, and commercial service enterprises.",
      icon: ShieldCheck,
      color: "text-brand-primary",
      bg: "bg-brand-primary/10",
    },
    {
      title: "Real-Time Business Discovery",
      description: "Filter live agricultural produce, fish batches, cold-storage, and machinery across state districts.",
      icon: Search,
      color: "text-brand-secondary",
      bg: "bg-brand-secondary/10",
    },
    {
      title: "Supply & Logistics Coordination",
      description: "Connect harvest supply with local tractors, harvesting crews, cold storage, and transport providers.",
      icon: Wrench,
      color: "text-brand-primary",
      bg: "bg-brand-primary/10",
    },
    {
      title: "Secure Transaction Infrastructure",
      description: "Structured purchase orders, direct B2B messaging channels, and transparent unit pricing records.",
      icon: TrendingUp,
      color: "text-brand-secondary",
      bg: "bg-brand-secondary/10",
    },
  ];

  // How It Works Steps
  const howItWorksSteps = [
    {
      step: "01",
      title: "Discover",
      desc: "Find commodities, businesses and services across regional agricultural and aquacultural clusters.",
      icon: Search,
      href: "/marketplace",
    },
    {
      step: "02",
      title: "Connect",
      desc: "Connect directly with relevant businesses, send enquiries, and build long-term supply partnerships.",
      icon: Handshake,
      href: "/network",
    },
    {
      step: "03",
      title: "Trade",
      desc: "Move from discovery to structured business transactions with clear quantity and pricing terms.",
      icon: Store,
      href: "/register",
    },
    {
      step: "04",
      title: "Grow",
      desc: "Expand reach, partnerships and distribution through a unified digital operating network.",
      icon: TrendingUp,
      href: "/register",
    },
  ];

  // Role-Based Value Cards
  const roleCards = [
    {
      role: "Farmers & Producers",
      desc: "Cultivate crops and inland aquaculture with direct commercial buyer access.",
      bullets: [
        "Discover buyers seeking bulk harvests",
        "Showcase agricultural & aquaculture products",
        "Build a verified professional business presence",
      ],
      icon: Sprout,
      color: "text-brand-primary",
      border: "border-brand-primary/20",
      cta: "Register as Farmer",
      href: "/register?role=FARMER",
    },
    {
      role: "Commercial Buyers",
      desc: "Wholesalers, food processors, supermarkets, and export traders.",
      bullets: [
        "Discover reliable farm-gate suppliers",
        "Explore real-time harvest commodities",
        "Connect directly with registered producers",
      ],
      icon: Store,
      color: "text-brand-secondary",
      border: "border-brand-secondary/20",
      cta: "Register as Buyer",
      href: "/register?role=BUYER",
    },
    {
      role: "Service Providers",
      desc: "Machinery owners, cold-chain operators, testing labs, and transport vendors.",
      bullets: [
        "Showcase equipment and specialized services",
        "Reach active agriculture & aquaculture farms",
        "Build professional regional service presence",
      ],
      icon: Wrench,
      color: "text-brand-primary",
      border: "border-brand-primary/20",
      cta: "Register as Provider",
      href: "/register?role=SERVICE_PROVIDER",
    },
    {
      role: "Field Agents",
      desc: "Regional facilitators assisting rural producers and local business coordination.",
      bullets: [
        "Support local business relationships",
        "Facilitate producer onboarding & verification",
        "Manage field operations where implemented",
      ],
      icon: Briefcase,
      color: "text-brand-secondary",
      border: "border-brand-secondary/20",
      cta: "Register as Agent",
      href: "/register?role=AGENT",
    },
  ];

  return (
    <AppShell
      currentPath="/"
      userRole={session?.role || "Guest"}
      userName={session?.fullName || "Welcome"}
    >
      {/* SECTION 1: HERO */}
      <LandingHero />

      {/* SECTION 2: WORKING GLOBAL SEARCH */}
      <GlobalMarketplaceSearch />

      {/* SECTION 3: CATEGORY DISCOVERY */}
      <CategoryDiscovery />

      {/* SECTION 4: FEATURED MARKETPLACE */}
      <section className="py-14 sm:py-18 bg-white border-b border-surface-dim">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-primary">
                <Store className="h-4 w-4" />
                <span>Commodity Catalog</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">
                Featured Marketplace
              </h2>
              <p className="text-xs sm:text-sm text-slate-neutral">
                Live agricultural crops and freshwater aquaculture harvests from registered producers.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors"
            >
              <span>View All Commodities</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
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
            <div className="rounded-xl border border-dashed border-surface-dim bg-white/70 p-8 sm:p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary mx-auto">
                <Sprout className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-heading font-bold text-base text-on-surface">
                  No products listed yet.
                </h3>
                <p className="text-xs text-slate-neutral leading-relaxed">
                  Real wholesale agricultural and aquaculture harvests will appear here as soon as registered producers add active inventory to the catalog.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href="/register?role=FARMER">
                  <Button variant="primary" size="sm" className="font-semibold text-xs gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>List Harvest</span>
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" size="sm" className="font-semibold text-xs bg-white">
                    Explore Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: AGRICULTURE + AQUACULTURE SHOWCASE */}
      <DualSectorShowcase />

      {/* SECTION 6: BUSINESS NETWORK */}
      <section className="py-14 sm:py-18 bg-white border-b border-surface-dim">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-secondary">
                <Users className="h-4 w-4" />
                <span>Ecosystem Directory</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">
                Business Network
              </h2>
              <p className="text-xs sm:text-sm text-slate-neutral">
                Connect with verified agricultural enterprises, commercial buyers, and aquaculture operations.
              </p>
            </div>
            <Link
              href="/network"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-secondary hover:text-brand-primary transition-colors"
            >
              <span>Explore Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {genuineProfiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {genuineProfiles.map((item) => (
                <NetworkCard
                  key={item.id}
                  id={item.id}
                  userId={item.userId}
                  displayName={item.displayName}
                  headline={item.headline}
                  bio={item.bio}
                  participantType={item.participantType}
                  businessCategory={item.businessCategory}
                  sector={item.sector}
                  district={item.district}
                  state={item.state}
                  avatarUrl={item.avatarUrl}
                  isVerified={item.isVerified}
                  connectionCount={item.connectionCount || 0}
                  activeListingsCount={item.activeListingsCount || 0}
                  initialConnectionStatus={item.connectionStatus}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-surface-dim bg-surface-low/60 p-8 sm:p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-secondary/10 text-brand-secondary mx-auto">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-heading font-bold text-base text-on-surface">
                  Verified Business Network
                </h3>
                <p className="text-xs text-slate-neutral leading-relaxed">
                  Join India&apos;s digital network for agriculture and aquaculture businesses. Showcase your operations and expand trading partnerships.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href="/register">
                  <Button variant="primary" size="sm" className="font-semibold text-xs">
                    Join Directory
                  </Button>
                </Link>
                <Link href="/network">
                  <Button variant="outline" size="sm" className="font-semibold text-xs bg-white">
                    View Network
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 7: SERVICES & LOGISTICS */}
      <section className="py-12 sm:py-16 bg-surface border-b border-surface-dim">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-primary">
                <Wrench className="h-4 w-4" />
                <span>Operations & Machinery</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">
                Agri & Aqua Services
              </h2>
              <p className="text-xs sm:text-sm text-slate-neutral">
                Equipment rental, soil/water lab testing, cold storage, and harvest handling services.
              </p>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors"
            >
              <span>View All Services</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {genuineServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {genuineServices.map((s) => (
                <ServiceCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  description={s.description}
                  category={s.category}
                  sector={s.sector || "AGRICULTURE"}
                  pricingModel={s.pricingModel}
                  basePrice={s.basePrice}
                  coverImageUrl={s.coverImageUrl}
                  serviceArea={s.serviceArea}
                  locationDistrict={s.locationDistrict}
                  locationState={s.locationState}
                  provider={s.provider || {
                    id: s.providerProfileId || "",
                    userId: "",
                    businessName: "Verified Provider",
                    isVerified: true,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-surface-dim bg-white/70 p-8 sm:p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary mx-auto">
                <Wrench className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-heading font-bold text-base text-on-surface">
                  No services listed yet.
                </h3>
                <p className="text-xs text-slate-neutral leading-relaxed">
                  Service providers offering tractors, harvesters, testing labs, or cold storage can register their services to reach regional producers.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href="/register?role=SERVICE_PROVIDER">
                  <Button variant="primary" size="sm" className="font-semibold text-xs">
                    List Services
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" size="sm" className="font-semibold text-xs bg-white">
                    Explore Services
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6: HOW IT WORKS */}
      <section id="how-it-works" className="py-14 sm:py-20 bg-white border-b border-surface-dim scroll-mt-16">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-surface-dim bg-surface-low text-xs font-semibold text-brand-primary">
              <span>Operating Flow</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">
              How the Network Operates
            </h2>
            <p className="text-xs sm:text-sm text-slate-neutral font-body">
              A structured 4-step path from market discovery to business expansion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative rounded-xl border border-surface-dim bg-surface-low/40 p-6 space-y-4 hover:bg-white hover:shadow-stitch-card hover:border-brand-primary/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-black text-brand-secondary/40">
                        {item.step}
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-on-surface">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-neutral leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-surface-dim/60">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors"
                    >
                      <span>Explore step</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7: ROLE-BASED VALUE PROPOSITIONS */}
      <section className="py-14 sm:py-20 bg-surface border-b border-surface-dim">
        <div className="mx-auto max-w-stitch-container px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-surface-dim bg-white text-xs font-semibold text-brand-secondary">
              <span>Ecosystem Roles</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">
              Value for Every Business Role
            </h2>
            <p className="text-xs sm:text-sm text-slate-neutral font-body">
              Tailored capabilities designed for the distinct operational workflows of producers, buyers, providers, and agents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roleCards.map((rc) => {
              const Icon = rc.icon;
              return (
                <Card
                  key={rc.role}
                  className={`border ${rc.border} bg-white shadow-stitch-card hover:shadow-md transition-all flex flex-col justify-between`}
                >
                  <CardHeader className="space-y-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-surface-low ${rc.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base font-bold font-heading text-on-surface">
                        {rc.role}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-neutral leading-relaxed">
                        {rc.desc}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <ul className="space-y-2 text-xs text-slate-neutral">
                      {rc.bullets.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-surface-dim">
                      <Link href={rc.href}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs font-semibold text-on-surface hover:text-brand-primary hover:border-brand-primary"
                        >
                          {rc.cta}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 8: FINAL CTA */}
      <section className="py-16 sm:py-20 bg-brand-primary text-white relative overflow-hidden">
        {/* Subtle Decorative Accents */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-primary-light/40 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-stitch-container mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-brand-primary-container backdrop-blur-sm border border-white/15">
            <Sprout className="h-3.5 w-3.5" />
            <span>EcoFarm Digital Agriculture Platform</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Build your business in the EcoFarm ecosystem.
          </h2>

          <p className="font-body text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
            Connect directly with verified farmers, aquaculture producers, commercial buyers and service providers across India.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto min-h-[48px] px-8 text-sm sm:text-base font-bold bg-white text-brand-primary hover:bg-surface-low shadow-lg gap-2 rounded-lg"
              >
                <span>Join EcoFarm</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-h-[48px] px-8 text-sm sm:text-base font-bold text-white border-white/40 hover:bg-white/10 hover:border-white rounded-lg"
              >
                Explore Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { FarmService } from "@/services/farm.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { StatCard } from "@/components/cards/stat-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { ProductCard } from "@/components/cards/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PackageCheck,
  Clock,
  AlertTriangle,
  Plus,
  Layers,
  MapPin,
  User,
  Sprout,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FarmerDashboardPage() {
  const user = await requireRole("FARMER");

  let stats = {
    totalProducts: 0,
    activeProducts: 0,
    pendingModeration: 0,
    outOfStock: 0,
    draftProducts: 0,
    pausedProducts: 0,
  };
  let farms: any[] = [];
  let recentProducts: any[] = [];

  try {
    const [fetchedStats, fetchedFarms, fetchedProducts] = await Promise.all([
      ProductService.getFarmerProductStats(user.userId),
      FarmService.getFarmerFarms(user.userId),
      ProductService.getFarmerProducts(user.userId, {
        page: 1,
        limit: 4,
        sortBy: "newest",
      }),
    ]);
    stats = fetchedStats;
    farms = fetchedFarms;
    recentProducts = fetchedProducts.items;
  } catch (err) {
    console.warn("Farmer dashboard database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <AppShell showSidebar userRole="FARMER" userName={user.fullName} currentPath="/farmer">
      {/* MOBILE FARMER DASHBOARD (< md) */}
      <div className="block md:hidden px-4 py-4 space-y-4 font-body pb-24">
        {/* Greeting & Role */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-extrabold text-lg text-on-surface">
              Hello, {user.fullName.split(" ")[0]} 👋
            </h1>
            <p className="text-xs text-slate-neutral">Producer & Farm Hub</p>
          </div>
          <Badge variant="primary" size="sm">Verified Producer</Badge>
        </div>

        {/* Primary Action Button */}
        <Link
          href="/farmer/products/new"
          className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 rounded-xl bg-brand-primary text-white font-heading font-bold text-xs shadow-sm active:scale-[0.98] transition-transform"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Harvest / Catch</span>
        </Link>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/farmer/products"
            className="p-2.5 rounded-xl bg-white border border-surface-dim shadow-xs active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-1.5 text-brand-primary">
              <PackageCheck className="h-4 w-4" />
              <span className="font-heading font-black text-base">{stats.activeProducts}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-neutral block mt-0.5">Active Lots</span>
          </Link>

          <Link
            href="/farmer/products"
            className="p-2.5 rounded-xl bg-white border border-surface-dim shadow-xs active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-1.5 text-amber-600">
              <Clock className="h-4 w-4" />
              <span className="font-heading font-black text-base">{stats.pendingModeration}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-neutral block mt-0.5">In Review</span>
          </Link>

          <Link
            href="/farmer/products"
            className="p-2.5 rounded-xl bg-white border border-surface-dim shadow-xs active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-heading font-black text-base">{stats.outOfStock}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-neutral block mt-0.5">Out of Stock</span>
          </Link>
        </div>

        {/* 4 Quick Actions */}
        <div className="grid grid-cols-4 gap-2 text-center pt-1">
          <Link
            href="/farmer/products"
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-surface-dim/70 shadow-xs"
          >
            <div className="h-9 w-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-on-surface">Catalog</span>
          </Link>

          <Link
            href="/farmer/orders"
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-surface-dim/70 shadow-xs"
          >
            <div className="h-9 w-9 rounded-lg bg-brand-secondary/15 text-brand-secondary flex items-center justify-center">
              <PackageCheck className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-on-surface">Orders</span>
          </Link>

          <Link
            href="/farmer/farms"
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-surface-dim/70 shadow-xs"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
              <Sprout className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-on-surface">Farms</span>
          </Link>

          <Link
            href="/messages"
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white border border-surface-dim/70 shadow-xs"
          >
            <div className="h-9 w-9 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold text-on-surface">Messages</span>
          </Link>
        </div>

        {/* EcoFarm AI Advisory Banner */}
        <Link
          href="/ai"
          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-heading text-xs font-bold leading-tight">Ask EcoFarm AI</div>
              <div className="text-[10px] text-emerald-100 leading-tight">Crop protection, pond care & pricing</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-200" />
        </Link>

        {/* Recent Products Grid (2-column) */}
        <div className="pt-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm text-on-surface">
              Your Recent Listings
            </h2>
            <Link
              href="/farmer/products"
              className="text-[11px] font-semibold text-brand-primary"
            >
              View All ({stats.totalProducts})
            </Link>
          </div>

          {recentProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {recentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  title={product.title}
                  sector={product.sector}
                  category={product.category}
                  variety={product.variety}
                  pricePerUnit={product.pricePerUnit.toNumber()}
                  unit={product.unit}
                  availableStock={product.availableStock.toNumber()}
                  sellerName={user.fullName}
                  isSellerVerified={true}
                  locationDistrict={product.locationDistrict}
                  locationState={product.locationState}
                  imageUrl={product.images[0]?.url}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Products Listed Yet"
              description="Add your first crop harvest or live fish catch."
              actionLabel="Add First Product"
              actionHref="/farmer/products/new"
            />
          )}
        </div>
      </div>

      {/* DESKTOP FARMER PORTAL (>= md) — 100% UNCHANGED */}
      <div className="hidden md:block p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-8 font-body">
        {/* Page Header */}
        <PageHeader
          title="Farmer Dashboard"
          description="Manage your verified agricultural harvests, aquaculture catches, farm parcels, and wholesale marketplace listings."
          badge={<Badge variant="primary">Verified Producer</Badge>}
          actions={
            <div className="flex items-center gap-2.5">
              <Link
                href="/farmer/products/new"
                className="inline-flex items-center justify-center font-heading font-semibold text-xs h-8 px-3 rounded-sm gap-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Commodity</span>
              </Link>
            </div>
          }
        />

        {/* KPI Stats Grid */}
        <StatGrid columns={4}>
          <Link href="/farmer/products" className="block group">
            <StatCard
              title="Active Marketplace"
              value={stats.activeProducts}
              timeframe="Live on B2B Catalog"
              icon={PackageCheck}
              iconVariant="primary"
            />
          </Link>
          <Link href="/farmer/products" className="block group">
            <StatCard
              title="Pending Moderation"
              value={stats.pendingModeration}
              timeframe="Under Agent/Admin Review"
              icon={Clock}
              iconVariant="warning"
            />
          </Link>
          <Link href="/farmer/products" className="block group">
            <StatCard
              title="Out of Stock"
              value={stats.outOfStock}
              timeframe="Zero Available Inventory"
              icon={AlertTriangle}
              iconVariant="info"
            />
          </Link>
          <Link href="/farmer/farms" className="block group">
            <StatCard
              title="Registered Farms"
              value={farms.length}
              timeframe="Acreage & Ponds"
              icon={Sprout}
              iconVariant="secondary"
            />
          </Link>
        </StatGrid>

        {/* Quick Operational Actions */}
        <div className="space-y-3">
          <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-neutral">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Link href="/farmer/products/new" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary mb-2 group-hover:scale-105 transition-transform">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Add Harvest</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">List crops or live fish</div>
              </Card>
            </Link>

            <Link href="/farmer/products" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-secondary/10 text-brand-secondary mb-2 group-hover:scale-105 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Manage Products</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">{stats.totalProducts} Total Listings</div>
              </Card>
            </Link>

            <Link href="/farmer/farms" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-status-success/10 text-status-success mb-2 group-hover:scale-105 transition-transform">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Manage Farms</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">{farms.length} Registered Land/Ponds</div>
              </Card>
            </Link>

            <Link href="/farmer/profile" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-container text-brand-primary mb-2 group-hover:scale-105 transition-transform">
                  <User className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Farmer Profile</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">Update Contact & Location</div>
              </Card>
            </Link>

            <Link href="/ai" className="block">
              <Card className="hover:border-emerald-500/40 hover:shadow-sm transition-all p-4 text-left group bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-emerald-200/70">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 mb-2 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Ask EcoFarm AI</div>
                <div className="text-[11px] text-emerald-800/80 mt-0.5">Crops, Fish & Pricing Advice</div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Harvests / Marketplace Listings */}
        <div className="space-y-4">
          <SectionHeader
            title="Recent Product Listings"
            subtitle="Your most recently created agricultural and aquaculture commodities."
            actionHref="/farmer/products"
            actionLabel="View All Products"
          />

          {recentProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  title={product.title}
                  sector={product.sector}
                  category={product.category}
                  variety={product.variety}
                  pricePerUnit={product.pricePerUnit.toNumber()}
                  unit={product.unit}
                  availableStock={product.availableStock.toNumber()}
                  sellerName={user.fullName}
                  isSellerVerified={true}
                  locationDistrict={product.locationDistrict}
                  locationState={product.locationState}
                  imageUrl={product.images[0]?.url}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Products Listed Yet"
              description="Add your first crop harvest or live fish catch to receive inquiries and bulk purchase orders."
              actionLabel="Add First Product"
              actionHref="/farmer/products/new"
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
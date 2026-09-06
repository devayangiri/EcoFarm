import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
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
  Bookmark,
  FileText,
  MessageSquare,
  Users,
  Search,
  Plus,
  User,
  ShoppingBag,
  ShoppingCart,
  Package,
  ArrowRight,
  Sprout,
  Waves,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BuyerDashboardPage() {
  const user = await requireRole("BUYER");
  let isDbUnavailable = false;
  let dashboardData = {
    metrics: {
      savedProducts: 0,
      activeRequirements: "Coming Soon" as string | number,
      productInquiries: 0,
      connectedSuppliers: 0,
      cartItems: 0,
      activeOrders: 0,
    },
    features: {
      isSavedProductsAvailable: true,
      isRequirementsAvailable: false,
      isCartAvailable: true,
    },
    recentRequirements: [] as any[],
    recentOrders: [] as any[],
    recommendedProducts: [] as any[],
  };

  try {
    dashboardData = (await BuyerService.getBuyerDashboard(user.userId)) as any;
  } catch (err) {
    isDbUnavailable = true;
    console.error("[BuyerDashboard] Active database query failed:", {
      userId: user.userId,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }
  const { metrics, features, recentRequirements, recommendedProducts } = dashboardData;

  return (
    <AppShell showSidebar userRole="BUYER" userName={user.fullName} currentPath="/buyer">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-8 font-body">
        {/* Page Header */}
        <PageHeader
          title="Buyer Procurement Hub"
          description="Discover verified farm-gate harvests, post procurement RFQs, and coordinate bulk wholesale trade."
          badge={<Badge variant="secondary">Commercial Buyer</Badge>}
          actions={
            <div className="flex items-center gap-2.5">
              <Link href="/buyer/requirements">
                <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                  Post RFQ
                </Button>
              </Link>
              <Link href="/buyer/marketplace">
                <Button variant="primary" size="sm" leftIcon={<Search className="h-4 w-4" />}>
                  Explore Catalog
                </Button>
              </Link>
            </div>
          }
        />

        {isDbUnavailable && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-6 text-center space-y-3 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-amber-800 font-heading font-bold text-sm">
              <span>Dashboard Data Temporarily Unavailable</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              We encountered a temporary connection issue while querying live commodity data. Your account and profile remain completely safe.
            </p>
            <div className="pt-1">
              <a
                href="/buyer"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                Retry Connection
              </a>
            </div>
          </div>
        )}

        {/* B2B Marketplace Search & Category Quick Discovery */}
        <div className="rounded-2xl border border-surface-dim bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <form action="/buyer/marketplace" method="GET" className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-neutral">
              <Search className="h-4 w-4 text-brand-primary" />
            </div>
            <input
              type="text"
              name="search"
              placeholder="Search products, seeds, fish, machinery..."
              className="w-full pl-10 pr-24 py-2.5 sm:py-3 rounded-xl border border-surface-dim bg-surface-low text-on-surface text-xs sm:text-sm placeholder:text-slate-neutral focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all shadow-inner"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="absolute right-1.5 h-8 px-4 text-xs font-semibold rounded-lg"
            >
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="font-semibold text-on-surface shrink-0 text-[11px] uppercase tracking-wider">
              Quick Filter:
            </span>
            <Link
              href="/buyer/marketplace"
              className="px-2.5 py-1 rounded-md bg-surface-low hover:bg-brand-primary/10 hover:text-brand-primary text-slate-neutral font-medium transition-colors shrink-0"
            >
              All Lots
            </Link>
            <Link
              href="/buyer/marketplace?category=GRAINS"
              className="px-2.5 py-1 rounded-md bg-surface-low hover:bg-brand-primary/10 hover:text-brand-primary text-slate-neutral font-medium transition-colors shrink-0"
            >
              Grains & Paddy
            </Link>
            <Link
              href="/buyer/marketplace?category=VEGETABLES"
              className="px-2.5 py-1 rounded-md bg-surface-low hover:bg-brand-primary/10 hover:text-brand-primary text-slate-neutral font-medium transition-colors shrink-0"
            >
              Vegetables
            </Link>
            <Link
              href="/buyer/marketplace?category=FRUITS"
              className="px-2.5 py-1 rounded-md bg-surface-low hover:bg-brand-primary/10 hover:text-brand-primary text-slate-neutral font-medium transition-colors shrink-0"
            >
              Fruits
            </Link>
            <Link
              href="/buyer/marketplace?sector=AQUACULTURE"
              className="px-2.5 py-1 rounded-md bg-surface-low hover:bg-brand-secondary/10 hover:text-brand-secondary text-slate-neutral font-medium transition-colors shrink-0"
            >
              Fish & Aquaculture
            </Link>
            <Link
              href="/buyer/marketplace?category=SEEDS"
              className="px-2.5 py-1 rounded-md bg-surface-low hover:bg-brand-primary/10 hover:text-brand-primary text-slate-neutral font-medium transition-colors shrink-0"
            >
              Certified Seeds
            </Link>
            <Link
              href="/buyer/services?category=MACHINERY_RENTAL"
              className="px-2.5 py-1 rounded-md bg-surface-low hover:bg-brand-primary/10 hover:text-brand-primary text-slate-neutral font-medium transition-colors shrink-0"
            >
              Machinery & Logistics
            </Link>
          </div>
        </div>

        {/* Real KPI Metrics */}
        <StatGrid columns={4}>
          <StatCard
            title="Saved Lots"
            value={metrics.savedProducts}
            timeframe="Monitored listings"
            icon={Bookmark}
            iconVariant="primary"
          />
          <StatCard
            title="Procurement Cart"
            value={metrics.cartItems}
            timeframe="Lots ready for checkout"
            icon={ShoppingCart}
            iconVariant="secondary"
          />
          <StatCard
            title="Purchase Orders"
            value={metrics.activeOrders}
            timeframe="Confirmed & dispatched"
            icon={Package}
            iconVariant="success"
          />
          <StatCard
            title="Producer Inquiries"
            value={metrics.productInquiries}
            timeframe="Active producer threads"
            icon={MessageSquare}
            iconVariant="info"
          />
        </StatGrid>

        {/* Quick Operational Actions */}
        <div className="space-y-3">
          <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-neutral">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/buyer/marketplace" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary mb-2 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Browse Marketplace</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">Agriculture & Aquaculture</div>
              </Card>
            </Link>

            <Link href="/buyer/cart" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-secondary/10 text-brand-secondary mb-2 group-hover:scale-105 transition-transform">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Procurement Cart</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">
                  {metrics.cartItems} Lots in Cart
                </div>
              </Card>
            </Link>

            <Link href="/buyer/orders" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-status-success/10 text-status-success mb-2 group-hover:scale-105 transition-transform">
                  <Package className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Purchase Orders</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">
                  {metrics.activeOrders} Orders Placed
                </div>
              </Card>
            </Link>

            <Link href="/buyer/saved" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-container text-brand-primary mb-2 group-hover:scale-105 transition-transform">
                  <Bookmark className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Saved Lots</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">{metrics.savedProducts} Saved Lots</div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Purchase Orders Snapshot if any */}
        {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 && (
          <div className="space-y-4">
            <SectionHeader
              title="Recent Purchase Orders"
              subtitle="Latest multi-vendor procurement orders and consignment milestones."
              actionHref="/buyer/orders"
              actionLabel="View All Orders"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {dashboardData.recentOrders.map((ord: any) => (
                <Link key={ord.id} href={`/buyer/orders/${ord.id}`} className="block">
                  <Card className="p-4 border border-surface-dim bg-white hover:border-brand-primary/40 transition-all space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-primary">{ord.orderNumber}</span>
                      <Badge variant={ord.status === "COMPLETED" ? "success" : "info"} size="sm">
                        {ord.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-neutral">
                      {ord.subOrderCount} Sub-Order(s) • {new Date(ord.createdAt).toLocaleDateString()}
                    </div>
                    <div className="font-heading font-extrabold text-sm text-on-surface">
                      ₹{ord.totalAmount.toLocaleString("en-IN")}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Harvests & Aquaculture Catches */}
        <div className="space-y-4">
          <SectionHeader
            title="Fresh Market Harvests & Catches"
            subtitle="Verified producer lots available for bulk contract procurement."
            actionHref="/buyer/marketplace"
            actionLabel="View All Commodities"
          />

          {recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recommendedProducts.map((p) => (
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
                  sellerName={p.sellerName}
                  isSellerVerified={p.isSellerVerified}
                  locationDistrict={p.locationDistrict}
                  locationState={p.locationState}
                  imageUrl={p.imageUrl}
                  isBuyerPortal={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Products Live Currently"
              description="Check back soon as verified farmers and hatcheries upload daily harvests."
              actionLabel="Post Procurement Requirement"
              actionHref="/buyer/requirements"
            />
          )}
        </div>

        {/* Active Procurement Requirements Board Snapshot */}
        <div className="space-y-4">
          <SectionHeader
            title="Your Procurement Requirements"
            subtitle="Recent procurement RFQs published for producers and field agents."
            actionHref="/buyer/requirements"
            actionLabel="Manage Requirements"
          />

          {recentRequirements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentRequirements.map((req) => (
                <Card key={req.id} className="border border-surface-dim bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={req.sector === "AGRICULTURE" ? "primary" : "secondary"} size="sm">
                      {req.sector === "AGRICULTURE" ? (
                        <>
                          <Sprout className="h-3 w-3" />
                          <span>Agri</span>
                        </>
                      ) : (
                        <>
                          <Waves className="h-3 w-3" />
                          <span>Aqua</span>
                        </>
                      )}
                    </Badge>
                    <Badge variant="success" size="sm">{req.status}</Badge>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-on-surface line-clamp-1">{req.title}</h3>
                    <p className="text-xs text-slate-neutral">{req.category}</p>
                  </div>
                  <div className="flex items-baseline justify-between pt-2 border-t border-surface-dim text-xs">
                    <span className="text-slate-neutral">Required Volume:</span>
                    <span className="font-mono font-bold text-on-surface">{req.quantity} {req.unit}</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : !features.isRequirementsAvailable ? (
            <EmptyState
              icon={Clock}
              title="Buyer Requirements are coming soon."
              description="Bulk procurement RFQs and custom volume sourcing requests will be enabled in Phase 4. Explore active harvests on the marketplace catalog."
              actionLabel="Explore Catalog"
              actionHref="/buyer/marketplace"
            />
          ) : (
            <EmptyState
              title="No Active Requirements"
              description="Publish a procurement requirement to receive custom quotes from producers."
              actionLabel="Create First Requirement"
              actionHref="/buyer/requirements"
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
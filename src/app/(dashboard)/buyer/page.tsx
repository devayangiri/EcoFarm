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
  ArrowRight,
  Sprout,
  Waves,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BuyerDashboardPage() {
  const user = await requireRole("BUYER");
  const dashboardData = await BuyerService.getBuyerDashboard(user.userId);
  const { metrics, recentRequirements, recommendedProducts } = dashboardData;

  return (
    <AppShell showSidebar userRole="BUYER" userName={user.fullName} currentPath="/buyer">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-8 font-body">
        {/* Page Header */}
        <PageHeader
          title="Buyer Dashboard"
          description="Discover suppliers, manage requirements and grow your business network."
          badge={<Badge variant="secondary">Commercial Buyer</Badge>}
          actions={
            <div className="flex items-center gap-2.5">
              <Link href="/buyer/marketplace">
                <Button variant="primary" size="sm" leftIcon={<Search className="h-4 w-4" />}>
                  Explore Catalog
                </Button>
              </Link>
            </div>
          }
        />

        {/* Real KPI Metrics */}
        <StatGrid columns={4}>
          <StatCard
            title="Saved Products"
            value={metrics.savedProducts}
            timeframe="Monitored lots"
            icon={Bookmark}
            iconVariant="primary"
          />
          <StatCard
            title="Active Requirements"
            value={metrics.activeRequirements}
            timeframe="Published volume RFQs"
            icon={FileText}
            iconVariant="secondary"
          />
          <StatCard
            title="Product Inquiries"
            value={metrics.productInquiries}
            timeframe="Active producer threads"
            icon={MessageSquare}
            iconVariant="info"
          />
          <StatCard
            title="Connected Suppliers"
            value={metrics.connectedSuppliers}
            timeframe="Verified producers"
            icon={Users}
            iconVariant="warning"
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

            <Link href="/buyer/saved" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-secondary/10 text-brand-secondary mb-2 group-hover:scale-105 transition-transform">
                  <Bookmark className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Saved Products</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">{metrics.savedProducts} Saved Lots</div>
              </Card>
            </Link>

            <Link href="/buyer/requirements" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-status-success/10 text-status-success mb-2 group-hover:scale-105 transition-transform">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Post Requirement</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">Publish Bulk Procurement RFQ</div>
              </Card>
            </Link>

            <Link href="/buyer/profile" className="block">
              <Card className="hover:border-brand-primary/40 hover:shadow-sm transition-all p-4 text-left group">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-container text-brand-primary mb-2 group-hover:scale-105 transition-transform">
                  <User className="h-5 w-5" />
                </div>
                <div className="font-heading text-xs font-bold text-on-surface">Manage Profile</div>
                <div className="text-[11px] text-slate-neutral mt-0.5">Company & Billing Details</div>
              </Card>
            </Link>
          </div>
        </div>

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
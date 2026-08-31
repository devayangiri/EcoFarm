import React from "react";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { StatCard } from "@/components/cards/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Sprout, Waves, DollarSign, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FarmerAnalyticsPage() {
  const user = await requireRole("FARMER");

  return (
    <AppShell showSidebar userRole="FARMER" userName={user.fullName} currentPath="/farmer/analytics">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-8 font-body">
        <PageHeader
          title="Yield & Market Price Analytics"
          description="Track harvest production volume, wholesale commodity price benchmarks, and revenue realizations."
          breadcrumbs={[
            { label: "Farmer Portal", href: "/farmer" },
            { label: "Analytics", current: true },
          ]}
          badge={<Badge variant="primary">Real-Time Benchmarks</Badge>}
        />

        <StatGrid columns={4}>
          <StatCard
            title="Total Realized Volume"
            value="45.5 MT"
            timeframe="Current Fiscal Season"
            icon={Sprout}
            iconVariant="primary"
          />
          <StatCard
            title="Avg Wholesale Realization"
            value="₹2,180 / Qtl"
            timeframe="+8.5% above MSP benchmark"
            icon={TrendingUp}
            iconVariant="secondary"
          />
          <StatCard
            title="Total Revenue Realized"
            value="₹9,91,900"
            timeframe="Across 12 B2B contracts"
            icon={DollarSign}
            iconVariant="success"
          />
          <StatCard
            title="Fulfillment Reliability"
            value="98.4%"
            timeframe="Zero dispute incidents"
            icon={BarChart3}
            iconVariant="info"
          />
        </StatGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-surface-dim bg-white p-5 space-y-4">
            <CardHeader className="p-0 border-b border-surface-dim pb-3">
              <CardTitle className="text-base font-bold text-on-surface flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                Commodity Price Trends (West Bengal APMC & Spot)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between p-3 rounded bg-surface-low border border-surface-dim text-xs">
                <span className="font-semibold text-on-surface">Swarna Paddy (Grade A)</span>
                <span className="font-mono font-bold text-brand-primary">₹2,180 / Quintal</span>
                <Badge variant="success" size="sm">+3.2% 7d</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-surface-low border border-surface-dim text-xs">
                <span className="font-semibold text-on-surface">Rohu Live Fish (1.5kg+)</span>
                <span className="font-mono font-bold text-brand-secondary">₹185 / KG</span>
                <Badge variant="success" size="sm">+5.1% 7d</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-surface-low border border-surface-dim text-xs">
                <span className="font-semibold text-on-surface">Jyoti Seed Potato</span>
                <span className="font-mono font-bold text-on-surface">₹1,450 / Quintal</span>
                <Badge variant="neutral" size="sm">Stable</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-surface-dim bg-white p-5 space-y-4">
            <CardHeader className="p-0 border-b border-surface-dim pb-3">
              <CardTitle className="text-base font-bold text-on-surface flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-secondary" />
                Upcoming Harvest Forecasts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="p-3 rounded bg-surface-low border border-surface-dim space-y-1">
                <div className="flex justify-between text-xs font-bold text-on-surface">
                  <span>Aman Paddy (Purba Bardhaman)</span>
                  <span className="text-brand-primary">Expected 30 MT</span>
                </div>
                <p className="text-[11px] text-slate-neutral">Target Harvest Window: Nov 15 – Nov 30</p>
              </div>
              <div className="p-3 rounded bg-surface-low border border-surface-dim space-y-1">
                <div className="flex justify-between text-xs font-bold text-on-surface">
                  <span>Freshwater Catla Catch (Pond #2)</span>
                  <span className="text-brand-secondary">Expected 4,000 KG</span>
                </div>
                <p className="text-[11px] text-slate-neutral">Target Harvest Window: Oct 10 – Oct 20</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

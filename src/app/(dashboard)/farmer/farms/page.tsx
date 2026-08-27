import React from "react";
import { requireRole } from "@/lib/rbac";
import { FarmService } from "@/services/farm.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sprout, Waves, MapPin, Droplets, Mountain } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FarmerFarmsPage() {
  const user = await requireRole("FARMER");
  const farms = await FarmService.getFarmerFarms(user.userId);

  return (
    <AppShell showSidebar userRole="FARMER" userName={user.fullName} currentPath="/farmer/farms">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title="Farm Land & Pond Management"
          description="Register production acreage, water supply sources, and geographic locations for verified yield forecasting."
          breadcrumbs={[
            { label: "Farmer Portal", href: "/farmer" },
            { label: "Farms", current: true },
          ]}
        />

        {farms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <Card key={farm.id} className="border border-surface-dim bg-white shadow-sm hover:border-brand-primary/30 transition-all flex flex-col justify-between">
                <CardHeader className="bg-surface-low border-b border-surface-dim">
                  <div className="flex items-center justify-between">
                    <Badge variant={farm.sector === "AGRICULTURE" ? "primary" : "secondary"}>
                      {farm.sector === "AGRICULTURE" ? "Agriculture Farm" : "Aquaculture Pond"}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-on-surface">
                      {farm.totalAreaAcres.toNumber()} Acres
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold mt-1">{farm.name}</CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-3 text-xs">
                  {farm.waterSourceType && (
                    <div className="flex items-center gap-2 text-slate-neutral">
                      <Droplets className="h-4 w-4 text-brand-secondary shrink-0" />
                      <span>Water: <strong className="text-on-surface font-semibold">{farm.waterSourceType}</strong></span>
                    </div>
                  )}

                  {farm.soilType && (
                    <div className="flex items-center gap-2 text-slate-neutral">
                      <Mountain className="h-4 w-4 text-brand-primary shrink-0" />
                      <span>Soil / Bed: <strong className="text-on-surface font-semibold">{farm.soilType}</strong></span>
                    </div>
                  )}

                  {farm.address && (
                    <div className="flex items-start gap-2 text-slate-neutral pt-2 border-t border-surface-dim">
                      <MapPin className="h-4 w-4 text-slate-neutral shrink-0 mt-0.5" />
                      <div>
                        <div className="text-on-surface font-medium">{farm.address.villageOrStreet}</div>
                        <div className="text-[11px] text-slate-neutral">
                          {farm.address.district}, {farm.address.state} - {farm.address.pincode}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Farms Registered Yet"
            description="Add your first farm parcel or aquaculture pond to verify crop origins for wholesale buyers."
          />
        )}
      </div>
    </AppShell>
  );
}
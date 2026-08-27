import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Edit,
  Sprout,
  Waves,
  MapPin,
  Calendar,
  Layers,
  PackageCheck,
  ShieldCheck,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: { id: string };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const user = await requireRole("FARMER");

  let product;
  try {
    product = await ProductService.getProductById(user.userId, params.id);
  } catch {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active on Marketplace</Badge>;
      case "PENDING_MODERATION":
        return <Badge variant="warning">Under Moderation Review</Badge>;
      case "DRAFT":
        return <Badge variant="neutral">Draft</Badge>;
      case "PAUSED":
        return <Badge variant="info">Listing Paused</Badge>;
      case "OUT_OF_STOCK":
        return <Badge variant="error">Out of Stock</Badge>;
      case "ARCHIVED":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AppShell showSidebar userRole="FARMER" userName={user.fullName} currentPath="/farmer/products">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title={product.title}
          description={`Commodity ID: ${product.id}`}
          badge={getStatusBadge(product.status)}
          breadcrumbs={[
            { label: "Farmer Portal", href: "/farmer" },
            { label: "Products", href: "/farmer/products" },
            { label: product.title, current: true },
          ]}
          actions={
            product.status !== "ARCHIVED" && (
              <Link href={`/farmer/products/${product.id}/edit`}>
                <Button variant="primary" size="sm" leftIcon={<Edit className="h-4 w-4" />}>
                  Edit Listing
                </Button>
              </Link>
            )
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Main Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Image Gallery Preview */}
            <Card className="overflow-hidden border border-surface-dim bg-white shadow-sm">
              <div className="aspect-video w-full bg-surface-low overflow-hidden">
                {product.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].url}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-neutral/40">
                    {product.sector === "AGRICULTURE" ? <Sprout className="h-16 w-16" /> : <Waves className="h-16 w-16" />}
                  </div>
                )}
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                  <h2 className="font-heading text-lg font-bold text-on-surface">Description & Specifications</h2>
                  <p className="text-xs sm:text-sm text-slate-neutral leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-dim">
                  <div>
                    <span className="text-[11px] font-heading font-semibold uppercase text-slate-neutral block">
                      Sector
                    </span>
                    <span className="font-bold text-sm text-on-surface">
                      {product.sector === "AGRICULTURE" ? "Agriculture (Crops)" : "Aquaculture (Fish)"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-heading font-semibold uppercase text-slate-neutral block">
                      Category
                    </span>
                    <span className="font-bold text-sm text-on-surface">{product.category}</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-heading font-semibold uppercase text-slate-neutral block">
                      Variety / Breed
                    </span>
                    <span className="font-bold text-sm text-on-surface">{product.variety || "Standard Commercial"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar Details & Metrics */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-surface-dim bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Wholesale Pricing & Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-surface-low rounded border border-surface-dim space-y-1">
                  <span className="text-[11px] font-heading font-semibold uppercase text-slate-neutral block">
                    Price per Unit
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-2xl font-extrabold text-brand-primary">
                      {formatCurrency(product.pricePerUnit.toNumber())}
                    </span>
                    <span className="text-xs text-slate-neutral">/{product.unit}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-surface-dim">
                    <span className="text-slate-neutral">Available Stock:</span>
                    <span className="font-mono font-bold text-on-surface">{product.availableStock.toNumber()} {product.unit}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-dim">
                    <span className="text-slate-neutral">Reserved Stock:</span>
                    <span className="font-mono font-bold text-on-surface">{product.reservedStock.toNumber()} {product.unit}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-dim">
                    <span className="text-slate-neutral">Min Order Quantity:</span>
                    <span className="font-bold text-on-surface">{product.minimumOrderQuantity.toNumber()} {product.unit}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-neutral">Location:</span>
                    <span className="font-bold text-on-surface">{product.locationDistrict}, {product.locationState}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-surface-dim bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Moderation & Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-status-success shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-on-surface block">Ownership Verified</span>
                    <span className="text-slate-neutral">Direct Producer Account</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-brand-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-on-surface block">Status: {product.status}</span>
                    <span className="text-slate-neutral">Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
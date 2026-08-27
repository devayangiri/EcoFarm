import React from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/farmer/product-form";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: { id: string };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const user = await requireRole("FARMER");

  let product;
  try {
    product = await ProductService.getProductById(user.userId, params.id);
  } catch {
    notFound();
  }

  return (
    <AppShell showSidebar userRole="FARMER" userName={user.fullName} currentPath="/farmer/products">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title={`Edit Listing: ${product.title}`}
          description="Update crop specifications, adjust inventory stock, or submit changes for moderation."
          breadcrumbs={[
            { label: "Farmer Portal", href: "/farmer" },
            { label: "Products", href: "/farmer/products" },
            { label: product.title, href: `/farmer/products/${product.id}` },
            { label: "Edit", current: true },
          ]}
        />

        <ProductForm
          isEditing={true}
          initialData={{
            id: product.id,
            title: product.title,
            description: product.description,
            sector: product.sector,
            category: product.category,
            variety: product.variety,
            pricePerUnit: product.pricePerUnit.toNumber(),
            unit: product.unit,
            minimumOrderQuantity: product.minimumOrderQuantity.toNumber(),
            availableStock: product.availableStock.toNumber(),
            harvestDate: product.harvestDate ? product.harvestDate.toISOString() : null,
            locationDistrict: product.locationDistrict,
            locationState: product.locationState,
            images: product.images.map((img) => ({
              url: img.url,
              altText: img.altText || undefined,
              isPrimary: img.isPrimary,
            })),
            status: product.status,
          }}
        />
      </div>
    </AppShell>
  );
}
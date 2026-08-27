import React from "react";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/farmer/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await requireRole("FARMER");

  return (
    <AppShell showSidebar userRole="FARMER" userName={user.fullName} currentPath="/farmer/products/new">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title="Add New Commodity"
          description="List a new agricultural crop harvest or aquaculture catch on the B2B marketplace."
          breadcrumbs={[
            { label: "Farmer Portal", href: "/farmer" },
            { label: "Products", href: "/farmer/products" },
            { label: "New Product", current: true },
          ]}
        />

        <ProductForm />
      </div>
    </AppShell>
  );
}
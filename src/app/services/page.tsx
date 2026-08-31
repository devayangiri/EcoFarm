import React from "react";
import { ServiceService } from "@/services/service.service";
import { ServiceDirectoryBrowser } from "@/components/services/service-directory-browser";
import { ServiceDirectorySearchSchema } from "@/lib/validators/service.schema";
import { getCurrentUser } from "@/lib/rbac";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

interface ServicesDirectoryPageProps {
  searchParams: {
    search?: string;
    category?: string;
    sector?: string;
    pricingModel?: string;
    minPrice?: string;
    maxPrice?: string;
    state?: string;
    district?: string;
    verifiedOnly?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
  };
}

export default async function ServicesDirectoryPage({
  searchParams,
}: ServicesDirectoryPageProps) {
  const session = await getCurrentUser();

  const query = {
    search: searchParams.search,
    category: (searchParams.category as any) || "ALL",
    sector: (searchParams.sector as any) || "ALL",
    pricingModel: searchParams.pricingModel || "ALL",
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    state: searchParams.state,
    district: searchParams.district,
    verifiedOnly: searchParams.verifiedOnly,
    page: searchParams.page ? Number(searchParams.page) : 1,
    pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : 20,
    sortBy: (searchParams.sortBy as any) || "newest",
  };

  const validated = ServiceDirectorySearchSchema.parse(query);
  let result = {
    items: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
  };

  try {
    const fetchedResult = await ServiceService.searchServices(validated);
    result = fetchedResult as any;
  } catch (err) {
    console.warn("Services database query fallback:", err instanceof Error ? err.message : err);
  }

  return (
    <AppShell
      currentPath="/services"
      userRole={session?.role || "Guest"}
      userName={session?.fullName || "Welcome"}
    >
      <div className="py-6 max-w-stitch-container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-left font-body">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">
            Agricultural & Aquaculture Services Ecosystem
          </h1>
          <p className="text-xs text-slate-neutral">
            Rent combine harvesters, tractors, book cold chain warehousing, logistics fleets, and water testing laboratories.
          </p>
        </div>

        <ServiceDirectoryBrowser
          initialServices={result.items}
          pagination={result.pagination}
        />
      </div>
    </AppShell>
  );
}

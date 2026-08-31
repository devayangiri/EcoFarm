import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Eye,
  Edit,
  Sprout,
  Waves,
  PauseCircle,
  PlayCircle,
  Archive,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface FarmerProductsPageProps {
  searchParams: {
    search?: string;
    status?: string;
    sector?: string;
    page?: string;
  };
}

export default async function FarmerProductsPage({
  searchParams,
}: FarmerProductsPageProps) {
  const user = await requireRole("FARMER");
  const currentPage = Number(searchParams.page) || 1;

  let products: any[] = [];
  let pagination = {
    page: currentPage,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  try {
    const result = await ProductService.getFarmerProducts(user.userId, {
      search: searchParams.search,
      status: searchParams.status as any,
      sector: searchParams.sector as any,
      page: currentPage,
      limit: 10,
      sortBy: "newest",
    });
    products = result.items;
    pagination = {
      ...result.pagination,
      hasNext: result.pagination.page < result.pagination.totalPages,
      hasPrev: result.pagination.page > 1,
    };
  } catch (err) {
    console.warn("Farmer products database query fallback:", err instanceof Error ? err.message : err);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success">Active</Badge>;
      case "PENDING_MODERATION":
        return <Badge variant="warning">Pending Moderation</Badge>;
      case "DRAFT":
        return <Badge variant="neutral">Draft</Badge>;
      case "PAUSED":
        return <Badge variant="info">Paused</Badge>;
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
          title="Product Management"
          description="Manage harvest listings, track moderation status, update prices, and control stock availability."
          breadcrumbs={[
            { label: "Farmer Portal", href: "/farmer" },
            { label: "Products", current: true },
          ]}
          actions={
            <Link
              href="/farmer/products/new"
              className="inline-flex items-center justify-center font-heading font-semibold text-xs h-8 px-3 rounded-sm gap-1.5 bg-brand-primary text-white hover:bg-brand-primary-hover shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Product</span>
            </Link>
          }
        />

        {/* Search and Filter Bar */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs font-heading font-semibold">
            {[
              { label: "All Statuses", value: "" },
              { label: "Active", value: "ACTIVE" },
              { label: "Pending Moderation", value: "PENDING_MODERATION" },
              { label: "Drafts", value: "DRAFT" },
              { label: "Paused", value: "PAUSED" },
              { label: "Out of Stock", value: "OUT_OF_STOCK" },
            ].map((st) => (
              <Link
                key={st.label}
                href={`/farmer/products?${new URLSearchParams({
                  ...(searchParams.search && { search: searchParams.search }),
                  ...(st.value && { status: st.value }),
                }).toString()}`}
                className={`px-3 py-1 rounded-full border transition-all ${
                  (searchParams.status || "") === st.value
                    ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                    : "bg-white text-slate-neutral border-surface-dim hover:bg-surface-low"
                }`}
              >
                {st.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Product Table */}
        {products.length > 0 ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product / Commodity</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Wholesale Rate</TableHead>
                  <TableHead>Available Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded border border-surface-dim overflow-hidden bg-surface-low shrink-0">
                          {product.images[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-neutral/50">
                              <Sprout className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/farmer/products/${product.id}`}
                            className="font-heading font-bold text-sm text-on-surface hover:text-brand-primary line-clamp-1"
                          >
                            {product.title}
                          </Link>
                          <p className="text-xs text-slate-neutral">
                            {product.variety ? `Variety: ${product.variety}` : product.category}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={product.sector === "AGRICULTURE" ? "primary" : "secondary"} size="sm">
                        {product.sector === "AGRICULTURE" ? (
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
                    </TableCell>

                    <TableCell>
                      <span className="font-heading font-bold text-sm text-brand-primary">
                        {formatCurrency(product.pricePerUnit.toNumber())}
                      </span>
                      <span className="text-xs text-slate-neutral">/{product.unit}</span>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-on-surface">
                        {product.availableStock.toNumber()}
                      </span>
                      <span className="text-xs text-slate-neutral ml-1">{product.unit}</span>
                    </TableCell>

                    <TableCell>{getStatusBadge(product.status)}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/farmer/products/${product.id}`}>
                          <Button variant="ghost" size="icon-sm" title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {product.status !== "ARCHIVED" && (
                          <Link href={`/farmer/products/${product.id}/edit`}>
                            <Button variant="ghost" size="icon-sm" title="Edit product">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination.totalPages > 1 && (
              <div className="pt-2">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  pageSize={pagination.limit}
                  onPageChange={() => {}}
                />
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="No Products Match Filters"
            description="Try changing your search keywords, status filters, or create a new harvest listing."
            actionLabel="Add Commodity"
            actionHref="/farmer/products/new"
          />
        )}
      </div>
    </AppShell>
  );
}
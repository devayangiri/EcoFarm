import { NextRequest, NextResponse } from "next/server";
import { MarketplaceService } from "@/services/marketplace.service";
import { MarketplaceSearchSchema } from "@/lib/validators/marketplace.schema";
import { handleError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getCurrentUser();

    const query = {
      search: searchParams.get("search") || undefined,
      sector: searchParams.get("sector") || "ALL",
      category: searchParams.get("category") || undefined,
      variety: searchParams.get("variety") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      minMoq: searchParams.get("minMoq") || undefined,
      maxMoq: searchParams.get("maxMoq") || undefined,
      district: searchParams.get("district") || undefined,
      state: searchParams.get("state") || undefined,
      inStockOnly: searchParams.get("inStockOnly") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
      sortBy: searchParams.get("sortBy") || "newest",
    };

    const validated = MarketplaceSearchSchema.parse(query);
    const result = await MarketplaceService.searchProducts(validated, session?.userId);

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
}
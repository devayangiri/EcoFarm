import { NextRequest, NextResponse } from "next/server";
import { ServiceService } from "@/services/service.service";
import { ServiceDirectorySearchSchema } from "@/lib/validators/service.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || "ALL",
      sector: (searchParams.get("sector") as any) || "ALL",
      pricingModel: searchParams.get("pricingModel") || "ALL",
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      state: searchParams.get("state") || undefined,
      district: searchParams.get("district") || undefined,
      verifiedOnly: searchParams.get("verifiedOnly") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
      sortBy: searchParams.get("sortBy") || "newest",
    };

    const validated = ServiceDirectorySearchSchema.parse(query);
    const result = await ServiceService.searchServices(validated);

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
}

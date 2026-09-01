import { NextRequest, NextResponse } from "next/server";
import { NetworkService } from "@/services/network.service";
import { NetworkDirectorySearchSchema } from "@/lib/validators/network.schema";
import { getCurrentUser } from "@/lib/rbac";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getCurrentUser();

    const query = {
      search: searchParams.get("search") || undefined,
      participantType: searchParams.get("participantType") || "ALL",
      sector: (searchParams.get("sector") as any) || "ALL",
      category: searchParams.get("category") || undefined,
      state: searchParams.get("state") || undefined,
      district: searchParams.get("district") || undefined,
      verifiedOnly: searchParams.get("verifiedOnly") || undefined,
      page: searchParams.get("page") || 1,
      pageSize: searchParams.get("pageSize") || 20,
      sortBy: searchParams.get("sortBy") || "newest",
    };

    const validated = NetworkDirectorySearchSchema.parse(query);
    const result = await NetworkService.searchDirectory(validated, session?.userId);

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("[NetworkDirectoryAPI] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "An unexpected internal server error occurred",
          meta: error?.meta,
        },
      },
      { status: 500 }
    );
  }
}

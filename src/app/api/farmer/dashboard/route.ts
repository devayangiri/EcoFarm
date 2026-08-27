import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { FarmService } from "@/services/farm.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("FARMER");
    const [stats, farms, recentProducts] = await Promise.all([
      ProductService.getFarmerProductStats(user.userId),
      FarmService.getFarmerFarms(user.userId),
      ProductService.getFarmerProducts(user.userId, {
        page: 1,
        limit: 5,
        sortBy: "newest",
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        farmsCount: farms.length,
        recentProducts: recentProducts.items,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { MarketplaceService } from "@/services/marketplace.service";
import { handleError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser();
    const product = await MarketplaceService.getProductDetails(
      params.id,
      session?.userId
    );

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return handleError(error);
  }
}
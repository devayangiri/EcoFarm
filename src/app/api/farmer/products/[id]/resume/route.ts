import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("FARMER");
    const product = await ProductService.resumeProduct(user.userId, params.id);

    return NextResponse.json({
      success: true,
      message: "Product listing resumed",
      data: product,
    });
  } catch (error) {
    return handleError(error);
  }
}

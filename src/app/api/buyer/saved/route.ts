import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { handleError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SaveProductPayloadSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    const result = await BuyerService.getSavedProducts(user.userId, page, limit);

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const body = await request.json();
    const { productId } = SaveProductPayloadSchema.parse(body);

    const result = await BuyerService.saveProduct(user.userId, productId);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Product saved to your favorites",
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole("BUYER");
    const { searchParams } = new URL(request.url);
    let productId = searchParams.get("productId");
    if (!productId) {
      const body = await request.json().catch(() => null);
      productId = body?.productId;
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "productId is required" } },
        { status: 400 }
      );
    }

    await BuyerService.unsaveProduct(user.userId, productId);

    return NextResponse.json({
      success: true,
      message: "Product removed from your favorites",
    });
  } catch (error) {
    return handleError(error);
  }
}
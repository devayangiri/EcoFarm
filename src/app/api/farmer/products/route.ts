import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import {
  CreateProductSchema,
  ProductFilterSchema,
} from "@/lib/validators/product.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("FARMER");
    const { searchParams } = new URL(request.url);

    const filterInput = ProductFilterSchema.safeParse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      sector: searchParams.get("sector") || undefined,
      category: searchParams.get("category") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
    });

    if (!filterInput.success) {
      throw AppError.validation("Invalid filter parameters", filterInput.error.format());
    }

    const result = await ProductService.getFarmerProducts(
      user.userId,
      filterInput.data
    );

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
    const user = await requireRole("FARMER");
    const body = await request.json();

    const parseResult = CreateProductSchema.safeParse(body);
    if (!parseResult.success) {
      throw AppError.validation("Validation failed", parseResult.error.format());
    }

    const product = await ProductService.createProduct(
      user.userId,
      parseResult.data
    );

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: product,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

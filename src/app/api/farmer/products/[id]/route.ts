import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { ProductService } from "@/services/product.service";
import { UpdateProductSchema } from "@/lib/validators/product.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("FARMER");
    const product = await ProductService.getProductById(user.userId, params.id);

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("FARMER");
    const body = await request.json();

    const parseResult = UpdateProductSchema.safeParse(body);
    if (!parseResult.success) {
      throw AppError.validation("Validation failed", parseResult.error.format());
    }

    const product = await ProductService.updateProduct(
      user.userId,
      params.id,
      parseResult.data
    );

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("FARMER");
    const product = await ProductService.archiveProduct(user.userId, params.id);

    return NextResponse.json({
      success: true,
      message: "Product archived successfully",
      data: product,
    });
  } catch (error) {
    return handleError(error);
  }
}

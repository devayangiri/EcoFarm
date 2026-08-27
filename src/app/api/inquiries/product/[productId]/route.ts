import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { CreateProductInquirySchema } from "@/lib/validators/buyer.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = CreateProductInquirySchema.parse({
      ...body,
      productId: params.productId,
    });

    const conversation = await BuyerService.createProductInquiry(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: conversation,
        message: "Product inquiry sent successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
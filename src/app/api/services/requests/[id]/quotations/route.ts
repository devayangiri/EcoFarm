import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { CreateServiceQuotationSchema } from "@/lib/validators/service.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = CreateServiceQuotationSchema.parse({
      ...body,
      serviceRequestId: params.id,
    });

    const quotation = await ServiceService.createQuotation(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: quotation,
        message: "Quotation submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

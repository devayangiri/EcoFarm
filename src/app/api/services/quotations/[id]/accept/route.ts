import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const accepted = await ServiceService.acceptQuotation(user.userId, params.id);

    return NextResponse.json({
      success: true,
      data: accepted,
      message: "Quotation accepted successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

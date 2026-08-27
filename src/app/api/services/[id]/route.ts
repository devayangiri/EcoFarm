import { NextRequest, NextResponse } from "next/server";
import { ServiceService } from "@/services/service.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await ServiceService.getServiceDetails(params.id);

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error) {
    return handleError(error);
  }
}

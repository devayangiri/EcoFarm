import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { UpdateServiceListingSchema } from "@/lib/validators/service.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const service = await ServiceService.getServiceDetails(params.id);

    return NextResponse.json({
      success: true,
      data: service,
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
    const user = await requireAuth();
    const body = await request.json();
    const validated = UpdateServiceListingSchema.parse(body);

    const updated = await ServiceService.updateService(user.userId, params.id, validated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Service listing updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

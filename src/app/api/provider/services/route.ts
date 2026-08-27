import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { CreateServiceListingSchema } from "@/lib/validators/service.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const result = await ServiceService.getProviderServices(user.userId);

    return NextResponse.json({
      success: true,
      data: result.services,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = CreateServiceListingSchema.parse(body);

    const service = await ServiceService.createService(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: service,
        message: "Service listing created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { CreateServiceRequestSchema } from "@/lib/validators/service.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "provider" || user.role === "SERVICE_PROVIDER") {
      const result = await ServiceService.getProviderIncomingRequests(user.userId);
      return NextResponse.json({ success: true, data: result.requests });
    }

    const result = await ServiceService.getBuyerServiceRequests(user.userId);
    return NextResponse.json({ success: true, data: result.requests });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = CreateServiceRequestSchema.parse(body);

    const serviceRequest = await ServiceService.createServiceRequest(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: serviceRequest,
        message: "Service request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

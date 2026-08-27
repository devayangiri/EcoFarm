import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { ServiceService } from "@/services/service.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const dashboard = await ServiceService.getProviderDashboard(user.userId);

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    return handleError(error);
  }
}

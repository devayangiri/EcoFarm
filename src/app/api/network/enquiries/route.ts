import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { NetworkService } from "@/services/network.service";
import { CreateNetworkEnquirySchema } from "@/lib/validators/network.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = CreateNetworkEnquirySchema.parse(body);

    const message = await NetworkService.createEnquiry(user.userId, validated);

    return NextResponse.json(
      {
        success: true,
        data: message,
        message: "Commercial enquiry transmitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

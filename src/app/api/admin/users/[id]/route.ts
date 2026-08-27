import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission("ADMIN_VIEW_USERS");
    const user = await AdminService.getUserDetails(params.id);
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleError(error);
  }
}

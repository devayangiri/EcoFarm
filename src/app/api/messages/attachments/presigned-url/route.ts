import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { MessagingService } from "@/services/messaging.service";
import { AttachmentPresignSchema } from "@/lib/validators/message.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = AttachmentPresignSchema.parse(body);

    const uploadData = await MessagingService.getPresignedAttachmentUpload(
      user.userId,
      validated
    );

    return NextResponse.json({ success: true, data: uploadData });
  } catch (error) {
    return handleError(error);
  }
}

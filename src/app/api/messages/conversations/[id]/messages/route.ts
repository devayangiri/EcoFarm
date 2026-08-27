import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { MessagingService } from "@/services/messaging.service";
import {
  SendMessageSchema,
  MessageHistoryQuerySchema,
} from "@/lib/validators/message.schema";
import { handleError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const queryInput = {
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || 50,
      direction: (searchParams.get("direction") as any) || "before",
    };

    const validated = MessageHistoryQuerySchema.parse(queryInput);
    const result = await MessagingService.getMessages(user.userId, params.id, validated);

    return NextResponse.json({
      success: true,
      data: result.messages,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validated = SendMessageSchema.parse({
      ...body,
      conversationId: params.id,
    });

    const message = await MessagingService.sendMessage(user.userId, validated);

    return NextResponse.json(
      { success: true, data: message, message: "Message sent" },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

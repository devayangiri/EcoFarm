import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { MessagingService } from "@/services/messaging.service";
import {
  CreateDirectConversationSchema,
  CreateContextualConversationSchema,
} from "@/lib/validators/message.schema";
import { handleError, AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const conversations = await MessagingService.getConversations(user.userId);
    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (body.contextType && body.contextType !== "GENERAL") {
      const validated = CreateContextualConversationSchema.parse(body);
      const conversation = await MessagingService.createContextualConversation(
        user.userId,
        validated
      );
      return NextResponse.json(
        { success: true, data: conversation, message: "Contextual conversation started" },
        { status: 201 }
      );
    } else {
      const validated = CreateDirectConversationSchema.parse(body);
      const conversation = await MessagingService.createDirectConversation(
        user.userId,
        validated
      );
      return NextResponse.json(
        { success: true, data: conversation, message: "Conversation started" },
        { status: 201 }
      );
    }
  } catch (error) {
    return handleError(error);
  }
}

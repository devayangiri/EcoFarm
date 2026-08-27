import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import { messageEventBus } from "@/lib/events/message-bus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connection established message
      controller.enqueue(
        encoder.encode(`event: CONNECTED\ndata: ${JSON.stringify({ userId: session.userId, timestamp: new Date().toISOString() })}\n\n`)
      );

      // 2. Subscribe to user channel on MessageEventBus
      const unsubscribe = messageEventBus.subscribe(session.userId, (event) => {
        try {
          const sseMessage = `event: ${event.type}\nid: ${event.eventId}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
        } catch {
          // Controller might be closed
        }
      });

      // 3. Heartbeat timer (every 15s to keep connection alive)
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, 15000);

      // 4. Cleanup on abort/disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatTimer);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

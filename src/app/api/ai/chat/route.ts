import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import { env } from "@/lib/env";
import { ChatRequestSchema, extractResponseContent } from "@/lib/ai-chat";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = ChatRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid request body",
        },
        { status: 400 }
      );
    }

    const { message, sessionId } = parsed.data;

    // Authoritative Server-Side User Session Extraction (RBAC)
    // Never trust client-submitted userId or role
    const session = await getCurrentUser();
    const userId = session?.userId || "guest";
    const userRole = session?.role || "GUEST";

    const webhookUrl = env.ECOFARM_AI_WEBHOOK_URL || "https://ayan1.app.n8n.cloud/webhook/ecofarm-ai";

    // Request Payload matching exact n8n AI workflow specification
    // Provides both chatInput (expected by n8n AI Agent node) and message
    const n8nPayload = {
      chatInput: message,
      message,
      sessionId,
      userId,
      userRole,
      context: {
        source: "ecofarm",
      },
    };

    console.log("[EcoFarm AI] Dispatching to n8n webhook:", {
      webhookUrl,
      sessionId,
      userId,
      userRole,
      messageLength: message.length,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for LLM reasoning

    try {
      const n8nRes = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!n8nRes.ok) {
        const errBody = await n8nRes.text().catch(() => "");
        console.error(`[EcoFarm AI] n8n returned error status ${n8nRes.status}: ${n8nRes.statusText}`, errBody);
        return NextResponse.json(
          {
            success: false,
            error: "AI service temporarily unavailable",
            message: "EcoFarm AI is temporarily unavailable. Please try again.",
          },
          { status: 502 }
        );
      }

      const contentType = n8nRes.headers.get("content-type") || "";
      let responseText: string | null = null;

      if (contentType.includes("application/json")) {
        const json = await n8nRes.json().catch(() => null);
        responseText = extractResponseContent(json);
      } else {
        const text = await n8nRes.text().catch(() => null);
        // Sometimes n8n returns JSON with text/plain header
        try {
          const parsedJson = JSON.parse(text || "");
          responseText = extractResponseContent(parsedJson);
        } catch {
          responseText = extractResponseContent(text);
        }
      }

      if (!responseText) {
        console.warn("[EcoFarm AI] n8n returned empty or unparseable response payload");
        return NextResponse.json(
          {
            success: false,
            error: "AI service temporarily unavailable",
            message: "EcoFarm AI is temporarily unavailable. Please try again.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: responseText,
        data: {
          answer: responseText,
        },
        sessionId,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr?.name === "AbortError";
      console.error("[EcoFarm AI] Network failure communicating with n8n:", {
        isTimeout,
        error: fetchErr?.message || String(fetchErr),
      });

      return NextResponse.json(
        {
          success: false,
          error: isTimeout ? "AI request timed out" : "AI service temporarily unavailable",
          message: isTimeout
            ? "EcoFarm AI request timed out. Please try again."
            : "EcoFarm AI is temporarily unavailable. Please try again.",
        },
        { status: 504 }
      );
    }
  } catch (err: any) {
    console.error("[EcoFarm AI] Unhandled error in /api/ai/chat:", err);
    return NextResponse.json(
      {
        success: false,
        error: "AI service temporarily unavailable",
        message: "EcoFarm AI is temporarily unavailable. Please try again.",
      },
      { status: 500 }
    );
  }
}

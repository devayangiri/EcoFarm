import { z } from "zod";

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(3000, "Message too long"),
  sessionId: z.string().trim().min(1).default(() => crypto.randomUUID()),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Extracts clean textual content from diverse n8n workflow output formats.
 */
export function extractResponseContent(data: any): string | null {
  if (!data) return null;

  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  // Handle single array item wrapper: [{ output: "..." }]
  if (Array.isArray(data) && data.length > 0) {
    return extractResponseContent(data[0]);
  }

  if (typeof data === "object") {
    // Common keys used in n8n AI Agent / Respond to Webhook nodes
    const candidate =
      data.output ??
      data.message ??
      data.text ??
      data.response ??
      data.answer ??
      data.content ??
      data.result;

    if (candidate !== undefined && candidate !== null) {
      return extractResponseContent(candidate);
    }
  }

  return null;
}

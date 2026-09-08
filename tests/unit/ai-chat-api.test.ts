// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/ai/chat/route";
import { ChatRequestSchema, extractResponseContent } from "@/lib/ai-chat";
import * as rbac from "@/lib/rbac";

vi.mock("@/lib/rbac", () => ({
  getCurrentUser: vi.fn(),
}));

describe("EcoFarm AI Assistant - /api/ai/chat", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("1. ChatRequestSchema validation", () => {
    it("should accept valid message and sessionId", () => {
      const parsed = ChatRequestSchema.safeParse({
        message: "What are the main causes of yellow leaves in paddy?",
        sessionId: "session-12345",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.message).toBe("What are the main causes of yellow leaves in paddy?");
        expect(parsed.data.sessionId).toBe("session-12345");
      }
    });

    it("should auto-generate a sessionId if omitted", () => {
      const parsed = ChatRequestSchema.safeParse({
        message: "How can I improve fish growth in a pond?",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.sessionId).toBeDefined();
        expect(typeof parsed.data.sessionId).toBe("string");
        expect(parsed.data.sessionId.length).toBeGreaterThan(0);
      }
    });

    it("should reject empty or whitespace-only messages", () => {
      const empty = ChatRequestSchema.safeParse({ message: "" });
      expect(empty.success).toBe(false);

      const whitespace = ChatRequestSchema.safeParse({ message: "    " });
      expect(whitespace.success).toBe(false);
    });

    it("should reject messages exceeding 3000 characters", () => {
      const tooLong = ChatRequestSchema.safeParse({ message: "a".repeat(3001) });
      expect(tooLong.success).toBe(false);
    });
  });

  describe("2. extractResponseContent normalizer", () => {
    it("should extract string response", () => {
      expect(extractResponseContent("Yellow leaves are often caused by nitrogen deficiency.")).toBe(
        "Yellow leaves are often caused by nitrogen deficiency."
      );
    });

    it("should return null for empty or whitespace string", () => {
      expect(extractResponseContent("")).toBeNull();
      expect(extractResponseContent("   \n  ")).toBeNull();
      expect(extractResponseContent(null)).toBeNull();
      expect(extractResponseContent(undefined)).toBeNull();
    });

    it("should extract from common n8n object keys", () => {
      expect(extractResponseContent({ output: "Output response" })).toBe("Output response");
      expect(extractResponseContent({ message: "Message response" })).toBe("Message response");
      expect(extractResponseContent({ text: "Text response" })).toBe("Text response");
      expect(extractResponseContent({ response: "Response text" })).toBe("Response text");
      expect(extractResponseContent({ answer: "Answer text" })).toBe("Answer text");
      expect(extractResponseContent({ content: "Content text" })).toBe("Content text");
      expect(extractResponseContent({ result: "Result text" })).toBe("Result text");
    });

    it("should handle nested array response like [{ output: '...' }]", () => {
      expect(extractResponseContent([{ output: "Array output response" }])).toBe("Array output response");
      expect(extractResponseContent([{ text: "Array text response" }])).toBe("Array text response");
    });
  });

  describe("3. POST route handler - n8n Payload & Security", () => {
    it("should reject invalid request bodies with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: "" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe("Message cannot be empty");
    });

    it("should authoritatively pass authenticated userId and role to n8n payload", async () => {
      vi.mocked(rbac.getCurrentUser).mockResolvedValue({
        userId: "farmer-user-100",
        role: "FARMER",
        fullName: "Ramesh Farmer",
      } as any);

      let capturedPayload: any = null;
      global.fetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedPayload = JSON.parse(opts.body);
        return new Response(JSON.stringify({ output: "Use balanced NPK fertilizer." }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "What are the main causes of yellow leaves in paddy?",
          sessionId: "sess-abc",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe("Use balanced NPK fertilizer.");
      expect(data.sessionId).toBe("sess-abc");

      // Verify the n8n payload format requested by specification:
      expect(capturedPayload).toEqual({
        sessionId: "sess-abc",
        userId: "farmer-user-100",
        userRole: "FARMER",
        message: "What are the main causes of yellow leaves in paddy?",
        context: {
          source: "ecofarm",
        },
      });
      // The user message must NOT be a system prompt!
      expect(capturedPayload.message).toBe("What are the main causes of yellow leaves in paddy?");
    });

    it("should pass null userId and null userRole for guest users", async () => {
      vi.mocked(rbac.getCurrentUser).mockResolvedValue(null);

      let capturedPayload: any = null;
      global.fetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedPayload = JSON.parse(opts.body);
        return new Response(JSON.stringify({ text: "Maintain optimal dissolved oxygen levels." }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "How can I improve fish growth in a pond?",
          sessionId: "sess-fish-1",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe("Maintain optimal dissolved oxygen levels.");
      expect(capturedPayload.userId).toBeNull();
      expect(capturedPayload.userRole).toBeNull();
      expect(capturedPayload.message).toBe("How can I improve fish growth in a pond?");
    });

    it("should handle plain text response from n8n", async () => {
      vi.mocked(rbac.getCurrentUser).mockResolvedValue(null);

      global.fetch = vi.fn().mockResolvedValue(
        new Response("Plain text AI recommendation", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        })
      );

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "What is current mandi rate for mustard?",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe("Plain text AI recommendation");
    });

    it("should handle n8n HTTP 500 error gracefully", async () => {
      vi.mocked(rbac.getCurrentUser).mockResolvedValue(null);

      global.fetch = vi.fn().mockResolvedValue(
        new Response("Internal Server Error", {
          status: 500,
          statusText: "Internal Server Error",
        })
      );

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Test error scenario",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe("EcoFarm AI is temporarily unavailable. Please try again.");
    });

    it("should handle offline n8n network failure gracefully", async () => {
      vi.mocked(rbac.getCurrentUser).mockResolvedValue(null);

      global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED 127.0.0.1:5678"));

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Test offline n8n scenario",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(504);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe("EcoFarm AI is temporarily unavailable. Please try again.");
    });

    it("should handle n8n timeout (AbortError) gracefully", async () => {
      vi.mocked(rbac.getCurrentUser).mockResolvedValue(null);

      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Test timeout scenario",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(504);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe("EcoFarm AI request timed out. Please try again.");
    });
  });
});

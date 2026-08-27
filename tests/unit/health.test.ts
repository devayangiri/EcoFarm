import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/health/route";

// Mock Prisma probe for isolated unit testing
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

describe("GET /api/health", () => {
  it("should return a structured 200 OK health response", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("ok");
    expect(json.data.service).toBe("agri-aqua-api");
    expect(json.data.version).toBe("0.1.0");
    expect(json.data.timestamp).toBeDefined();
  });
});

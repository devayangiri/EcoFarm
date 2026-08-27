import { test, expect } from "@playwright/test";

test.describe("Phase 11: Contextual Messaging & Realtime SSE E2E", () => {
  test("redirects unauthenticated user from /messages to login", async ({ page }) => {
    await page.goto("/messages");
    await expect(page).toHaveURL(/login/);
  });

  test("blocks unauthenticated API access to /api/messages/conversations", async ({ request }) => {
    const res = await request.get("/api/messages/conversations");
    expect(res.status()).toBe(401);
  });

  test("blocks unauthenticated SSE connection to /api/messages/events", async ({ request }) => {
    const res = await request.get("/api/messages/events");
    expect(res.status()).toBe(401);
  });
});
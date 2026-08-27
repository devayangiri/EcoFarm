import { test, expect } from "@playwright/test";

test.describe("Phase 12: Notification Hub, Preferences & Multi-Channel E2E", () => {
  test("redirects unauthenticated user from /notifications to login", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated user from /notifications/settings to login", async ({ page }) => {
    await page.goto("/notifications/settings");
    await expect(page).toHaveURL(/login/);
  });

  test("blocks unauthenticated API access to /api/notifications", async ({ request }) => {
    const res = await request.get("/api/notifications");
    expect(res.status()).toBe(401);
  });

  test("blocks unauthenticated API access to /api/notifications/unread-count", async ({ request }) => {
    const res = await request.get("/api/notifications/unread-count");
    expect(res.status()).toBe(401);
  });

  test("blocks unauthenticated API access to /api/notifications/preferences", async ({ request }) => {
    const res = await request.get("/api/notifications/preferences");
    expect(res.status()).toBe(401);
  });
});
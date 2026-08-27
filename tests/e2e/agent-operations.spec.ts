import { test, expect } from "@playwright/test";

test.describe("Phase 10: Agent Operations Hub E2E", () => {
  test("redirects unauthenticated user from /agent to login", async ({ page }) => {
    await page.goto("/agent");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated user from /agent/leads to login", async ({ page }) => {
    await page.goto("/agent/leads");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated user from /agent/tasks to login", async ({ page }) => {
    await page.goto("/agent/tasks");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated user from /agent/verification to login", async ({ page }) => {
    await page.goto("/agent/verification");
    await expect(page).toHaveURL(/login/);
  });

  test("blocks unauthenticated API access to /api/agent/dashboard", async ({ request }) => {
    const res = await request.get("/api/agent/dashboard");
    expect(res.status()).toBe(401);
  });
});
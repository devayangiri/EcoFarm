import { test, expect } from "@playwright/test";

test.describe("Phase 16 — Production Smoke Tests & Go-Live Verification", () => {
  test("verifies public landing page and HTTP security headers", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Verify Brand & Tagline
    await expect(page).toHaveTitle(/Agri-Aqua Network/i);
    await expect(page.locator("h1")).toContainText("Agriculture");
    await expect(page.getByText("Connect. Trade. Grow.")).toBeVisible();

    // Verify Production Security Headers
    const headers = response?.headers() || {};
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("verifies liveness and readiness observability probes", async ({ request }) => {
    // 1. Liveness probe
    const live = await request.get("/api/health/live");
    expect(live.status()).toBe(200);
    const liveJson = await live.json();
    expect(liveJson.success).toBe(true);
    expect(liveJson.data.status).toBe("healthy");

    // 2. Readiness probe
    const ready = await request.get("/api/health/ready");
    expect(ready.status()).toBe(200);
    const readyJson = await ready.json();
    expect(readyJson.success).toBe(true);
    expect(readyJson.data.ready).toBe(true);
  });

  test("verifies marketplace browsing on production routes", async ({ page }) => {
    const response = await page.goto("/marketplace");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1, h2, h3").first()).toBeVisible();
  });
});

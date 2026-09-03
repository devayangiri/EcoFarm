import { test, expect } from "@playwright/test";

test.describe("Agri-Aqua Foundation E2E", () => {
  test("loads landing page and presents Stitch design tokens", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/EcoFarm|Agri-Aqua/i);
    await expect(page.locator("h1")).toContainText("Agriculture");
    await expect(page.getByText("Connect. Trade. Grow.")).toBeVisible();
  });

  test("probes health check API", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    const json = await health.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("ok");
  });
});

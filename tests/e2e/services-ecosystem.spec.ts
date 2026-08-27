import { test, expect } from "@playwright/test";

test.describe("Phase 9: Services Ecosystem & Quotation Engine E2E", () => {
  test("loads public services directory with search and category filters", async ({ page }) => {
    await page.goto("/services");
    await expect(page.locator("h1")).toContainText("Services Ecosystem");
    await expect(page.getByPlaceholder(/Search machinery, cold storage/i)).toBeVisible();
  });

  test("probes public services API endpoint", async ({ request }) => {
    const res = await request.get("/api/services?pageSize=10");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.pagination).toBeDefined();
  });

  test("redirects unauthenticated user from /provider to login", async ({ page }) => {
    await page.goto("/provider");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated user from /buyer/services to login", async ({ page }) => {
    await page.goto("/buyer/services");
    await expect(page).toHaveURL(/login/);
  });
});
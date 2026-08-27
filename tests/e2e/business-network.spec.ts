import { test, expect } from "@playwright/test";

test.describe("Phase 8: B2B Business Network & Directory E2E", () => {
  test("loads public directory page with participant tabs and search bar", async ({ page }) => {
    await page.goto("/network");
    await expect(page.locator("h1")).toContainText("B2B Agri-Aqua Business Directory");
    await expect(page.getByText("All Participants")).toBeVisible();
    await expect(page.getByText("Farmers & Producers")).toBeVisible();
    await expect(page.getByText("Commercial Buyers")).toBeVisible();
    await expect(page.getByPlaceholder(/Search by business name/i)).toBeVisible();
  });

  test("probes public directory API endpoint", async ({ request }) => {
    const res = await request.get("/api/network/directory?pageSize=10");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.pagination).toBeDefined();
  });

  test("redirects unauthenticated user from /network/connections to login", async ({ page }) => {
    await page.goto("/network/connections");
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated user from /network/profile to login", async ({ page }) => {
    await page.goto("/network/profile");
    await expect(page).toHaveURL(/login/);
  });
});
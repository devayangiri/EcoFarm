import { test, expect } from "@playwright/test";

test.describe("Local Root Routing & Navigation", () => {
  test("Public routes should load without authentication", async ({ page }) => {
    // Home
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /Connect. Trade. Grow./i })).toBeVisible();

    // Login
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /Sign In/i })).toBeVisible();

    // Register
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("heading", { name: /Join Agri-Aqua Network/i })).toBeVisible();

    // Marketplace
    await page.goto("/marketplace");
    await expect(page).toHaveURL(/\/marketplace/);
    await expect(page.getByRole("heading", { name: /B2B Dual Commodity Marketplace/i })).toBeVisible();

    // Business Network
    await page.goto("/network");
    await expect(page).toHaveURL(/\/network/);
    await expect(page.getByRole("heading", { name: /B2B Agri-Aqua Business Directory/i })).toBeVisible();

    // Services
    await page.goto("/services");
    await expect(page).toHaveURL(/\/services/);
    await expect(page.getByRole("heading", { name: /Agricultural & Aquaculture Services Ecosystem/i })).toBeVisible();
  });

  test("Protected routes redirect unauthenticated users to /login with callbackUrl", async ({ page }) => {
    const protectedPaths = ["/farmer", "/buyer", "/agent", "/provider", "/admin", "/messages", "/notifications"];

    for (const p of protectedPaths) {
      await page.goto(p);
      await expect(page).toHaveURL(new RegExp(`/login\?callbackUrl=.*${encodeURIComponent(p)}`));
    }
  });
});
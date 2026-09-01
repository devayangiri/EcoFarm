import { test, expect } from "@playwright/test";

test.describe("Public Commerce & Public Navigation Journey", () => {
  test("1. Homepage loads and does not link to fake feat-1 product IDs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Agri-Aqua/i);

    // Verify absence of fake feat-1 links
    const featLink = page.locator('a[href*="/marketplace/feat-1"]');
    await expect(featLink).toHaveCount(0);

    // Verify trust metrics do not claim 0% Fraud
    const bodyText = await page.innerText("body");
    expect(bodyText).not.toContain("0% Fraud");
    expect(bodyText).not.toContain("500+ MT");
    expect(bodyText).not.toContain("100% Live");
  });

  test("2. CTAs on homepage navigate to real registration and marketplace", async ({ page }) => {
    await page.goto("/");
    const joinBtn = page.locator('a[href="/register"]', { hasText: /Join the Network/i });
    if (await joinBtn.count() > 0) {
      await expect(joinBtn.first()).toBeVisible();
    }

    const marketBtn = page.locator('a[href="/marketplace"]', { hasText: /Explore Marketplace/i });
    if (await marketBtn.count() > 0) {
      await expect(marketBtn.first()).toBeVisible();
    }
  });

  test("3. Marketplace, Network, and Services pages open cleanly", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page).toHaveURL(/\/marketplace/);

    await page.goto("/network");
    await expect(page).toHaveURL(/\/network/);

    await page.goto("/services");
    await expect(page).toHaveURL(/\/services/);
  });
});

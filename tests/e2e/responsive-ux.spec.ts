import { test, expect } from "@playwright/test";

test.describe("Phase 14 — Responsive UX & Cross-Viewport Hardening", () => {
  const VIEWPORTS = [
    { name: "Mobile (360x800 - Android Small)", width: 360, height: 800 },
    { name: "Mobile (390x844 - iPhone 14)", width: 390, height: 844 },
    { name: "Mobile (412x915 - Android Large)", width: 412, height: 915 },
    { name: "Tablet (768x1024 - iPad Portrait)", width: 768, height: 1024 },
    { name: "Tablet (1024x768 - iPad Landscape)", width: 1024, height: 768 },
    { name: "Desktop (1280x800 - Laptop)", width: 1280, height: 800 },
    { name: "Desktop (1440x900 - Large Desktop)", width: 1440, height: 900 },
  ];

  for (const vp of VIEWPORTS) {
    test(`verifies zero horizontal page overflow on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      // Verify no horizontal overflow beyond viewport width
      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScrollbar).toBe(false);

      // Verify page title
      await expect(page).toHaveTitle(/EcoFarm|Agri-Aqua/i);
    });
  }

  test("verifies mobile bottom navigation is visible on small screen and hidden on desktop", async ({ page }) => {
    // 1. Mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const mobileNav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
    await expect(mobileNav).toBeVisible();

    // 2. Desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(mobileNav).toBeHidden();
  });

  test("verifies mobile touch targets have minimum interactive area", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Mobile nav links should meet minimum touch area
    const mobileNavLinks = page.locator('nav[aria-label="Mobile Bottom Navigation"] a');
    const count = await mobileNavLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const box = await mobileNavLinks.nth(i).boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test("verifies marketplace responsive layout on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/marketplace");

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});

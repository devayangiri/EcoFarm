import { test, expect } from "@playwright/test";

test.describe("Farmer Navigation & CTA Functionality Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
    const uniqueEmail = "farmer-nav-" + Date.now() + "@test.local";

    await page.fill("#fullName", "Ramesh Farmer");
    await page.fill("#email", uniqueEmail);
    await page.fill("#phone", "+919876543210");
    await page.fill("#password", "Password123!");
    await page.fill("#confirmPassword", "Password123!");
    await page.click("button:has-text(\"Continue to Role Selection\")");

    await expect(page.getByText("Select Your Primary Ecosystem Role")).toBeVisible();
    await page.click("button:has-text(\"Complete Registration & Join\")");

    await expect(page).toHaveURL(/\/farmer/);
    await expect(page.getByRole("heading", { name: "Farmer Dashboard" })).toBeVisible();
  });

  test("1. Desktop Header Navigation & Actions", async ({ page }) => {
    await page.click("header nav >> text=Marketplace");
    await expect(page).toHaveURL(/\/marketplace/);

    await page.goto("/farmer");
    await page.click("header nav >> text=Business Network");
    await expect(page).toHaveURL(/\/network/);

    await page.goto("/farmer");
    await page.click("header nav >> text=Services");
    await expect(page).toHaveURL(/\/services/);

    await page.goto("/farmer");
    await page.click("header >> a[aria-label=\"Notifications\"]");
    await expect(page).toHaveURL(/\/notifications/);

    await page.goto("/farmer");
    await page.click("header >> a[aria-label=\"Messages\"]");
    await expect(page).toHaveURL(/\/messages/);

    await page.goto("/farmer");
    await page.click("header >> a:has-text(\"Ramesh Farmer\")");
    await expect(page).toHaveURL(/\/farmer\/profile/);
  });

  test("2. Desktop Sidebar Navigation", async ({ page }) => {
    await page.click("aside nav >> text=Dashboard");
    await expect(page).toHaveURL(/\/farmer/);

    await page.click("aside nav >> text=Products / Listings");
    await expect(page).toHaveURL(/\/farmer\/products/);

    await page.click("aside nav >> text=Manage Farms");
    await expect(page).toHaveURL(/\/farmer\/farms/);

    await page.click("aside nav >> text=Orders & Cart");
    await expect(page).toHaveURL(/\/farmer\/orders/);

    await page.click("aside nav >> text=Business Network");
    await expect(page).toHaveURL(/\/network/);

    await page.goto("/farmer");
    await page.click("aside nav >> text=Services & Quotes");
    await expect(page).toHaveURL(/\/services/);

    await page.goto("/farmer");
    await page.click("aside nav >> text=Verifications");
    await expect(page).toHaveURL(/\/farmer\/profile/);

    await page.goto("/farmer");
    await page.click("aside nav >> text=Analytics");
    await expect(page).toHaveURL(/\/farmer\/analytics/);

    await page.goto("/farmer");
    await page.click("aside nav >> text=Settings");
    await expect(page).toHaveURL(/\/settings/);
  });

  test("3. Quick Operational Actions & Header CTA", async ({ page }) => {
    await page.click("a:has-text(\"Add Commodity\")");
    await expect(page).toHaveURL(/\/farmer\/products\/new/);

    await page.goto("/farmer");
    await page.click("a:has-text(\"Add Harvest\")");
    await expect(page).toHaveURL(/\/farmer\/products\/new/);

    await page.goto("/farmer");
    await page.click("a:has-text(\"Manage Products\")");
    await expect(page).toHaveURL(/\/farmer\/products/);

    await page.goto("/farmer");
    await page.click("a:has-text(\"Manage Farms\")");
    await expect(page).toHaveURL(/\/farmer\/farms/);

    await page.goto("/farmer");
    await page.click("a:has-text(\"Farmer Profile\")");
    await expect(page).toHaveURL(/\/farmer\/profile/);
  });

  test("4. Mobile Navigation Tabs (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/farmer");

    await page.click("nav >> text=Portal");
    await expect(page).toHaveURL(/\/farmer/);

    await page.click("nav >> text=Products");
    await expect(page).toHaveURL(/\/farmer\/products/);

    await page.click("nav >> text=Farms");
    await expect(page).toHaveURL(/\/farmer\/farms/);

    await page.click("nav >> text=Orders");
    await expect(page).toHaveURL(/\/farmer\/orders/);

    await page.click("nav >> text=Messages");
    await expect(page).toHaveURL(/\/messages/);
  });
});
import { test, expect } from "@playwright/test";

test.describe("Agri-Aqua Authentication & RBAC E2E", () => {
  test("Guest can navigate to login page with Stitch design system", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Sign In \| EcoFarm/i);
    await expect(page.locator("h1")).toContainText("Welcome Back");
    await expect(page.getByPlaceholder(/farmer@agriaqua.dev/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In to (EcoFarm|Network)/i })).toBeVisible();
  });

  test("Guest can navigate to registration page and step through role selection", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveTitle(/Create Account \| EcoFarm/i);
    await expect(page.locator("h1")).toContainText(/Join EcoFarm|Join the Network/i);
    await expect(page.getByText("Account Info")).toBeVisible();
    await expect(page.getByText("Role Selection")).toBeVisible();

    // Fill Step 1
    await page.getByPlaceholder("e.g. Ramesh Kumar").fill("Test Producer");
    await page.getByPlaceholder("name@example.com").fill("testproducer@agriaqua.dev");
    await page.getByPlaceholder("Minimum 8 characters with numbers & letters").fill("Password123!");
    await page.getByPlaceholder("Re-enter your password").fill("Password123!");

    // Proceed to Step 2
    await page.getByRole("button", { name: /Continue to Role Selection/i }).click();

    // Step 2 should display role cards (Farmer, Buyer, Agent, Service Provider)
    await expect(page.getByText("How will you participate in the Network?")).toBeVisible();
    await expect(page.getByText("Farmer / Producer")).toBeVisible();
    await expect(page.getByText("Commercial Buyer")).toBeVisible();
    await expect(page.getByText("Field Agent")).toBeVisible();
    await expect(page.getByText("Service Provider")).toBeVisible();
  });

  test("Unauthorized guest accessing protected routes is redirected to login", async ({ page }) => {
    await page.goto("/farmer");
    await expect(page).toHaveURL(/.*\/login\?callbackUrl=%2Ffarmer/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/.*\/login\?callbackUrl=%2Fadmin/);
  });
});

import { test, expect } from "@playwright/test";

test.describe("User Registration & Onboarding Flow", () => {
  test("FARMER registration flow completes and redirects to /farmer", async ({ page }) => {
    await page.goto("/register");
    const uniqueEmail = `farmer-${Date.now()}@test.local`;

    // Step 1: Personal Details
    await page.fill("#fullName", "Ramesh Kumar");
    await page.fill("#email", uniqueEmail);
    await page.fill("#phone", "+919876543210");
    await page.fill("#password", "SecurePassword123!");
    await page.fill("#confirmPassword", "SecurePassword123!");
    await page.click("button:has-text(\"Continue to Role Selection\")");

    // Step 2: Role Selection (Default FARMER)
    await expect(page.getByText("Select Your Primary Ecosystem Role")).toBeVisible();
    await page.click("button:has-text(\"Complete Registration & Join\")");

    // Expect redirection to farmer dashboard
    await expect(page).toHaveURL(/\/farmer/);
  });
});
import { test, expect } from "@playwright/test";

test.describe("Phase 13: Admin Control Center & Security E2E", () => {
  test("1. Unauthenticated or non-admin user cannot access /admin routes", async ({ page }) => {
    const res = await page.goto("/admin");
    expect(page.url()).not.toContain("/admin");
  });

  test("2. Admin API endpoints return 401/403 for unauthorized requests", async ({ request }) => {
    const res = await request.get("/api/admin/dashboard");
    expect(res.status()).toBe(401);
  });

  test("3. Admin user status endpoint enforces authentication", async ({ request }) => {
    const res = await request.patch("/api/admin/users/test-uuid/status", {
      data: { status: "SUSPENDED", reason: "Testing unauthorized attempt" },
    });
    expect(res.status()).toBe(401);
  });
});

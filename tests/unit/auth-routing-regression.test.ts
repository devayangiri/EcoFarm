// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRoleDashboardPath, hasRole } from "@/lib/rbac";
import { registerSchema, publicRoleSchema } from "@/lib/validators/auth.schema";
import { AuthService } from "@/services/auth.service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Auth & Routing Regression Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Role Dashboard Paths & Public Roles", () => {
    it("should map each role to its corresponding root dashboard path", () => {
      expect(getRoleDashboardPath("FARMER")).toBe("/farmer");
      expect(getRoleDashboardPath("BUYER")).toBe("/buyer");
      expect(getRoleDashboardPath("AGENT")).toBe("/agent");
      expect(getRoleDashboardPath("SERVICE_PROVIDER")).toBe("/provider");
      expect(getRoleDashboardPath("ADMIN")).toBe("/admin");
      expect(getRoleDashboardPath("GUEST" as any)).toBe("/");
    });

    it("should reject ADMIN in public registration schema", () => {
      const adminRoleResult = publicRoleSchema.safeParse("ADMIN");
      expect(adminRoleResult.success).toBe(false);

      const farmerResult = publicRoleSchema.safeParse("FARMER");
      expect(farmerResult.success).toBe(true);

      const buyerResult = publicRoleSchema.safeParse("BUYER");
      expect(buyerResult.success).toBe(true);

      const agentResult = publicRoleSchema.safeParse("AGENT");
      expect(agentResult.success).toBe(true);

      const providerResult = publicRoleSchema.safeParse("SERVICE_PROVIDER");
      expect(providerResult.success).toBe(true);
    });
  });

  describe("2. Registration Input Validation", () => {
    it("should reject registration attempts with ADMIN role via schema", () => {
      const adminAttempt = {
        fullName: "Malicious Admin",
        email: "hacker@test.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "ADMIN",
      };
      const result = registerSchema.safeParse(adminAttempt);
      expect(result.success).toBe(false);
    });

    it("should reject mismatched passwords", () => {
      const mismatched = {
        fullName: "Test Farmer",
        email: "farmer@test.com",
        password: "Password123!",
        confirmPassword: "Password456!",
        role: "FARMER",
      };
      const result = registerSchema.safeParse(mismatched);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.confirmPassword).toContain("Passwords do not match");
      }
    });
  });

  describe("3. AuthService Registration and Login Execution", () => {
    it("should register a new FARMER user successfully with JWT and redirectUrl", async () => {
      const uniqueEmail = `farmer-${Date.now()}@agriaqua.local`;
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "usr-farmer-123",
        fullName: "Ramesh Farmer",
        email: uniqueEmail,
        phone: null,
        role: "FARMER",
        status: "PENDING_VERIFICATION",
        tokenVersion: 1,
        createdAt: new Date(),
      } as any);

      const result = await AuthService.register({
        fullName: "Ramesh Farmer",
        email: uniqueEmail,
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
        role: "FARMER",
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe(uniqueEmail);
      expect(result.user.role).toBe("FARMER");
      expect(result.token).toBeDefined();
      expect(result.redirectUrl).toBe("/farmer");
    });

    it("should reject duplicate registration for existing email", async () => {
      const duplicateEmail = "existing@agriaqua.local";
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "usr-existing",
        email: duplicateEmail,
      } as any);

      await expect(
        AuthService.register({
          fullName: "Duplicate User",
          email: duplicateEmail,
          password: "StrongPassword123!",
          confirmPassword: "StrongPassword123!",
          role: "BUYER",
        })
      ).rejects.toThrow("An account with this email address already exists");
    });

    it("should authenticate registered user via login", async () => {
      const loginEmail = "buyer@agriaqua.local";
      const password = "LoginPassword123!";
      const { hashPassword } = await import("@/lib/auth");
      const passwordHash = await hashPassword(password);

      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: "usr-buyer-456",
        fullName: "Login Buyer",
        email: loginEmail,
        phone: null,
        passwordHash,
        role: "BUYER",
        status: "ACTIVE",
        tokenVersion: 1,
        createdAt: new Date(),
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const loginResult = await AuthService.login({
        identifier: loginEmail,
        password: password,
      });

      expect(loginResult).toBeDefined();
      expect(loginResult.user.email).toBe(loginEmail);
      expect(loginResult.user.role).toBe("BUYER");
      expect(loginResult.redirectUrl).toBe("/buyer");
    });
  });

  describe("4. Middleware CallbackUrl Loop Prevention", () => {
    it("should NOT bounce back to callbackUrl when visiting /login with callbackUrl", async () => {
      const { middleware } = await import("@/middleware");
      const { NextRequest } = await import("next/server");
      const { createSessionToken, SESSION_COOKIE_NAME } = await import("@/lib/auth");

      const token = await createSessionToken({
        userId: "test-user-id",
        email: "test@ayangiri.test",
        fullName: "Test User",
        role: "AGENT",
        status: "ACTIVE",
        tokenVersion: 1,
      });

      const request = new NextRequest("https://app.ayangiri.com/login?callbackUrl=/agent", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const response = await middleware(request);

      // Must NOT redirect (status should not be 307/308/302)
      expect(response.status).toBe(200);
      // Must delete or clear the stale session cookie on response
      const setCookie = response.headers.get("set-cookie") || "";
      expect(setCookie).toContain(SESSION_COOKIE_NAME);
    });

    it("should redirect to role dashboard when visiting /login directly without callbackUrl if authenticated", async () => {
      const { middleware } = await import("@/middleware");
      const { NextRequest } = await import("next/server");
      const { createSessionToken, SESSION_COOKIE_NAME } = await import("@/lib/auth");

      const token = await createSessionToken({
        userId: "test-user-id",
        email: "test@ayangiri.test",
        fullName: "Test User",
        role: "AGENT",
        status: "ACTIVE",
        tokenVersion: 1,
      });

      const request = new NextRequest("https://app.ayangiri.com/login", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://app.ayangiri.com/agent");
    });
  });
});
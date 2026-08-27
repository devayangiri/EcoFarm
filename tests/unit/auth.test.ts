import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/auth";
import { hasPermission, hasRole, getRoleDashboardPath, ROLE_PERMISSIONS } from "@/lib/rbac";
import { registerSchema, loginSchema, publicRoleSchema } from "@/lib/validators/auth.schema";
import { AuthService } from "@/services/auth.service";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserSession } from "@/types/role.types";

// Mock Prisma for isolated unit tests
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

describe("1. Password Security & Hashing", () => {
  it("should hash password with bcrypt and verify correctly", async () => {
    const rawPassword = "StrongPassword2026!";
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword123!", hash);
    expect(isWrongMatch).toBe(false);
  });
});

describe("2. JWT Session Engine", () => {
  it("should generate and verify signed JWT session token", async () => {
    const mockSession: UserSession = {
      userId: "user-123-uuid",
      email: "farmer@agriaqua.dev",
      fullName: "Ramesh Farmer",
      phone: "+919876543210",
      role: "FARMER",
      status: "ACTIVE",
      tokenVersion: 1,
    };

    const token = await createSessionToken(mockSession);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(mockSession.userId);
    expect(verified?.email).toBe(mockSession.email);
    expect(verified?.role).toBe("FARMER");
    expect(verified?.status).toBe("ACTIVE");
  });

  it("should reject tampered or invalid JWT tokens", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature";
    const verified = await verifySessionToken(invalidToken);
    expect(verified).toBeNull();
  });
});

describe("3. Registration & Login Zod Validation", () => {
  it("should accept valid registration input for public roles", () => {
    const validData = {
      fullName: "Priya Sharma",
      email: "priya@agriaqua.dev",
      phone: "+919876543211",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "BUYER",
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalidEmail = {
      fullName: "Priya Sharma",
      email: "invalid-email-address",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "BUYER",
    };

    const result = registerSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
  });

  it("should reject weak password (missing number/uppercase or too short)", () => {
    const weakPassword = {
      fullName: "Priya Sharma",
      email: "priya@agriaqua.dev",
      password: "weak",
      confirmPassword: "weak",
      role: "BUYER",
    };

    const result = registerSchema.safeParse(weakPassword);
    expect(result.success).toBe(false);
  });

  it("should reject non-matching passwords", () => {
    const mismatchedPasswords = {
      fullName: "Priya Sharma",
      email: "priya@agriaqua.dev",
      password: "Password123!",
      confirmPassword: "DifferentPassword123!",
      role: "BUYER",
    };

    const result = registerSchema.safeParse(mismatchedPasswords);
    expect(result.success).toBe(false);
  });

  it("should strictly reject ADMIN role during public registration schema parse", () => {
    const adminRegistration = {
      fullName: "Fake Admin",
      email: "admin@agriaqua.dev",
      password: "Password123!",
      confirmPassword: "Password123!",
      role: "ADMIN",
    };

    const result = registerSchema.safeParse(adminRegistration);
    expect(result.success).toBe(false);
  });
});

describe("4. AuthService Business Rules & RBAC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject duplicate email registration with CONFLICT error", async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: "existing-id",
      email: "farmer@agriaqua.dev",
    });

    await expect(
      AuthService.register({
        fullName: "New Farmer",
        email: "farmer@agriaqua.dev",
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "FARMER",
      })
    ).rejects.toThrow("An account with this email address already exists");
  });

  it("should reject login for SUSPENDED accounts", async () => {
    const passwordHash = await hashPassword("Password123!");
    (prisma.user.findFirst as any).mockResolvedValueOnce({
      id: "suspended-user-id",
      email: "suspended@agriaqua.dev",
      fullName: "Suspended User",
      passwordHash,
      role: "FARMER",
      status: "SUSPENDED",
      tokenVersion: 0,
    });

    await expect(
      AuthService.login({
        identifier: "suspended@agriaqua.dev",
        password: "Password123!",
      })
    ).rejects.toThrow("Your account has been suspended");
  });

  it("should reject invalid login credentials without exposing user existence", async () => {
    (prisma.user.findFirst as any).mockResolvedValueOnce(null);

    await expect(
      AuthService.login({
        identifier: "nonexistent@agriaqua.dev",
        password: "Password123!",
      })
    ).rejects.toThrow("Invalid email/phone or password");
  });
});

describe("5. Role-Based Access Control (RBAC) Matrix", () => {
  it("should grant FARMER permissions to manage own farm and products", () => {
    expect(hasPermission("FARMER", "FARM_MANAGE")).toBe(true);
    expect(hasPermission("FARMER", "PRODUCT_CREATE")).toBe(true);
    expect(hasPermission("FARMER", "PRODUCT_UPDATE")).toBe(true);
    expect(hasPermission("FARMER", "PRODUCT_READ_OWN")).toBe(true);
  });

  it("should deny BUYER from managing farms or creating products", () => {
    expect(hasPermission("BUYER", "FARM_MANAGE")).toBe(false);
    expect(hasPermission("BUYER", "PRODUCT_CREATE")).toBe(false);
    expect(hasPermission("BUYER", "ADMIN_MANAGE_USERS")).toBe(false);
  });

  it("should grant AGENT permissions to manage assigned leads and verification reviews", () => {
    expect(hasPermission("AGENT", "AGENT_MANAGE_LEADS")).toBe(true);
    expect(hasPermission("AGENT", "AGENT_REVIEW_VERIFICATION")).toBe(true);
    expect(hasPermission("AGENT", "ADMIN_MANAGE_USERS")).toBe(false);
  });

  it("should grant ADMIN full platform permissions", () => {
    expect(hasPermission("ADMIN", "ADMIN_MANAGE_USERS")).toBe(true);
    expect(hasPermission("ADMIN", "ADMIN_MANAGE_PRODUCTS")).toBe(true);
    expect(hasPermission("ADMIN", "ADMIN_VIEW_ANALYTICS")).toBe(true);
    expect(hasPermission("ADMIN", "ADMIN_MANAGE_SETTINGS")).toBe(true);
  });

  it("should map roles to correct dashboard URLs", () => {
    expect(getRoleDashboardPath("FARMER")).toBe("/farmer");
    expect(getRoleDashboardPath("BUYER")).toBe("/buyer");
    expect(getRoleDashboardPath("AGENT")).toBe("/agent");
    expect(getRoleDashboardPath("SERVICE_PROVIDER")).toBe("/provider");
    expect(getRoleDashboardPath("ADMIN")).toBe("/admin");
  });
});

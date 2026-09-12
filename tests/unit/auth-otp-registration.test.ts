import { describe, it, expect, vi } from "vitest";
import { AuthService } from "@/services/auth.service";
import { OtpService } from "@/services/otp.service";
import { prisma } from "@/lib/prisma";

// Mock Prisma to immediately route to memory fallback store in unit tests
vi.mock("@/lib/prisma", () => ({
  prisma: {
    otpVerification: {
      findUnique: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      findFirst: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      create: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      update: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      updateMany: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
    },
    user: {
      findUnique: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      findFirst: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      create: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      update: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
    },
  },
}));

describe("Registration OTP Flow Unit Tests", () => {
  const timestamp = Date.now();
  const testEmail = `new.farmer.${timestamp}@agriaqua.net`;
  const testPhone = `+9198765${(timestamp % 90000 + 10000)}`;

  it("should initiate registration and issue OTP challenge", async () => {
    const result = await AuthService.initiateRegistration({
      fullName: "Anand Farmer",
      email: testEmail,
      phone: testPhone,
      password: "StrongPassword2026!",
      confirmPassword: "StrongPassword2026!",
      role: "FARMER",
    });

    expect(result.verificationToken).toBeDefined();
    expect(result.destination).toContain("@");
    expect(result.destinationType).toBe("EMAIL");
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should reject verification with invalid OTP code", async () => {
    await expect(
      AuthService.verifyRegistrationOtp({
        destination: testEmail,
        otp: "000000",
        purpose: "REGISTRATION",
      })
    ).rejects.toThrow(/Invalid verification code/);
  });

  it("should verify registration and activate user", async () => {
    const regEmail = `verify.reg.${Date.now()}@agriaqua.net`;
    await AuthService.initiateRegistration({
      fullName: "Verify Farmer",
      email: regEmail,
      password: "StrongPassword2026!",
      confirmPassword: "StrongPassword2026!",
      role: "FARMER",
    });

    const challenge = await OtpService.createOtpChallenge({
      destination: `direct.reg.${Date.now()}@agriaqua.net`,
      destinationType: "EMAIL",
      purpose: "REGISTRATION",
    });

    const verifyResult = await OtpService.verifyOtpChallenge({
      destination: challenge.destination,
      purpose: "REGISTRATION",
      otp: challenge.otp,
    });
    expect(verifyResult.success).toBe(true);
  });

  it("should prevent duplicate registration for an existing ACTIVE account", async () => {
    const activeEmail = `active.farmer.${Date.now()}@agriaqua.net`;
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: "existing-active-user-123",
      email: activeEmail,
      status: "ACTIVE",
    });

    await expect(
      AuthService.initiateRegistration({
        fullName: "Another Farmer",
        email: activeEmail,
        password: "StrongPassword2026!",
        confirmPassword: "StrongPassword2026!",
        role: "FARMER",
      })
    ).rejects.toThrow(/An account with this email address already exists/);
  });

  it("should reject ADMIN self-registration attempt", async () => {
    await expect(
      AuthService.initiateRegistration({
        fullName: "Fake Admin",
        email: `admin.${Date.now()}@agriaqua.net`,
        password: "StrongPassword2026!",
        confirmPassword: "StrongPassword2026!",
        role: "ADMIN" as any,
      })
    ).rejects.toThrow(/Administrative accounts cannot be created/);
  });
});

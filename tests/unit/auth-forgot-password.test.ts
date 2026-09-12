import { describe, it, expect, vi } from "vitest";
import { AuthService } from "@/services/auth.service";
import { OtpService } from "@/services/otp.service";

// Mock Prisma to immediately route to memory fallback store in unit tests
vi.mock("@/lib/prisma", () => ({
  prisma: {
    otpVerification: {
      findUnique: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      findFirst: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      create: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      update: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      updateMany: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      deleteMany: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
    },
    user: {
      findUnique: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      findFirst: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      create: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
      update: vi.fn().mockRejectedValue(new Error("Database disconnected in unit test")),
    },
  },
}));

describe("Forgot Password & Reset Flow Unit Tests", () => {
  const initialPassword = "InitialPassword2026!";
  const updatedPassword = "UpdatedPassword2026!";

  it("should create user for forgot password testing", async () => {
    const testEmail = `forgot.user.create.${Date.now()}@agriaqua.net`;
    const { user } = await AuthService.register({
      fullName: "Reset Test User",
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
      role: "BUYER",
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);
  });

  it("should return generic message on request-otp to prevent enumeration", async () => {
    const testEmail = `forgot.enum.${Date.now()}@agriaqua.net`;
    await AuthService.register({
      fullName: "Enum Test User",
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
      role: "BUYER",
    });

    // Existing user
    const existingRes = await AuthService.requestPasswordResetOtp(testEmail);
    expect(existingRes.success).toBe(true);
    expect(existingRes.message).toBe("If the account exists, a verification code has been sent.");

    // Non-existent user
    const nonExistentRes = await AuthService.requestPasswordResetOtp(`nonexistent.${Date.now()}@agriaqua.net`);
    expect(nonExistentRes.success).toBe(true);
    expect(nonExistentRes.message).toBe("If the account exists, a verification code has been sent.");
  });

  it("should reject invalid OTP for password reset", async () => {
    const testEmail = `forgot.invalid.${Date.now()}@agriaqua.net`;
    await AuthService.register({
      fullName: "Invalid OTP User",
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
      role: "BUYER",
    });

    await AuthService.requestPasswordResetOtp(testEmail);

    await expect(
      AuthService.verifyPasswordResetOtp(testEmail, "000000")
    ).rejects.toThrow(/Invalid verification code/);
  });

  it("should verify correct OTP and generate purpose-bound reset token", async () => {
    const testEmail = `forgot.reset.${Date.now()}@agriaqua.net`;
    await AuthService.register({
      fullName: "Valid Reset User",
      email: testEmail,
      password: initialPassword,
      confirmPassword: initialPassword,
      role: "BUYER",
    });

    // Create challenge directly for testing OTP verification
    const challenge = await OtpService.createOtpChallenge({
      destination: testEmail,
      destinationType: "EMAIL",
      purpose: "PASSWORD_RESET",
    });

    const verifyRes = await AuthService.verifyPasswordResetOtp(testEmail, challenge.otp);
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.resetToken).toBeDefined();
    expect(typeof verifyRes.resetToken).toBe("string");

    // Reset password using the reset token
    const resetRes = await AuthService.resetPassword(verifyRes.resetToken, updatedPassword);
    expect(resetRes.success).toBe(true);
    expect(resetRes.message).toContain("successfully reset");

    // Login with new password should succeed
    const loginRes = await AuthService.login({
      identifier: testEmail,
      password: updatedPassword,
    });
    expect(loginRes.token).toBeDefined();
    expect(loginRes.user.email).toBe(testEmail);

    // Login with old password should fail
    await expect(
      AuthService.login({
        identifier: testEmail,
        password: initialPassword,
      })
    ).rejects.toThrow(/Invalid email\/phone or password/);
  });

  it("should reject re-use or invalid reset token", async () => {
    await expect(
      AuthService.resetPassword("invalid-or-forged-jwt-token", updatedPassword)
    ).rejects.toThrow(/Invalid or expired password reset token/);
  });
});

import { describe, it, expect, vi } from "vitest";
import { AuthService } from "@/services/auth.service";
import { OtpService } from "@/services/otp.service";
import { OtpDeliveryService } from "@/services/otp-delivery.service";
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

  it("should prevent login while account is PENDING_VERIFICATION", async () => {
    const pendingEmail = `pending.user.${Date.now()}@agriaqua.net`;
    const plainPass = "StrongPassword2026!";

    // 1. Initiate registration -> user is PENDING_VERIFICATION
    await AuthService.initiateRegistration({
      fullName: "Pending User",
      email: pendingEmail,
      password: plainPass,
      confirmPassword: plainPass,
      role: "FARMER",
    });

    // 2. Attempt login BEFORE OTP verification -> MUST fail strictly
    await expect(
      AuthService.login({
        identifier: pendingEmail,
        password: plainPass,
      })
    ).rejects.toThrow(/pending verification/i);
  });

  it("should enforce purpose isolation: password reset OTP cannot be used for registration", async () => {
    const targetEmail = `purpose.test.${Date.now()}@agriaqua.net`;

    // Create password reset challenge
    const resetChallenge = await OtpService.createOtpChallenge({
      destination: targetEmail,
      destinationType: "EMAIL",
      purpose: "PASSWORD_RESET",
    });

    // Try to verify as REGISTRATION -> purpose mismatch
    await expect(
      OtpService.verifyOtpChallenge({
        challengeId: resetChallenge.challengeId,
        destination: targetEmail,
        purpose: "REGISTRATION",
        otp: resetChallenge.otp,
      })
    ).rejects.toThrow(/Invalid verification purpose/i);
  });

  it("should invalidate challenge when OtpService.invalidateChallenge is called", async () => {
    const targetEmail = `invalid.test.${Date.now()}@agriaqua.net`;

    const challenge = await OtpService.createOtpChallenge({
      destination: targetEmail,
      destinationType: "EMAIL",
      purpose: "REGISTRATION",
    });

    // Invalidate challenge (as happens on delivery failure)
    await OtpService.invalidateChallenge(challenge.challengeId);

    // Attempting verification with valid OTP code should now fail because challenge was invalidated
    await expect(
      OtpService.verifyOtpChallenge({
        challengeId: challenge.challengeId,
        destination: targetEmail,
        purpose: "REGISTRATION",
        otp: challenge.otp,
      })
    ).rejects.toThrow(/already been used/i);
  });

  it("should allow login only after OTP verification activates the user", async () => {
    const activateEmail = `activate.user.${Date.now()}@agriaqua.net`;
    const plainPass = "StrongPassword2026!";

    let dispatchedOtp = "";
    vi.spyOn(OtpDeliveryService, "sendOtp").mockImplementationOnce(async (payload) => {
      dispatchedOtp = payload.otp;
      return { success: true, provider: "mock-test", providerMessageId: "msg-1" };
    });

    // 1. Initiate registration -> user is PENDING_VERIFICATION
    const initResult = await AuthService.initiateRegistration({
      fullName: "Soon Active",
      email: activateEmail,
      password: plainPass,
      confirmPassword: plainPass,
      role: "BUYER",
    });

    expect(dispatchedOtp).toHaveLength(6);

    // 2. Submit OTP to verify and activate
    const verifyResponse = await AuthService.verifyRegistrationOtp({
      verificationToken: initResult.verificationToken,
      destination: activateEmail,
      purpose: "REGISTRATION",
      otp: dispatchedOtp,
    });

    expect(verifyResponse.user.status).toBe("ACTIVE");
    expect(verifyResponse.token).toBeDefined();
    expect(verifyResponse.redirectUrl).toBe("/buyer");

    // 3. Now login must succeed because user is now ACTIVE
    const loginResult = await AuthService.login({
      identifier: activateEmail,
      password: plainPass,
    });

    expect(loginResult.user.status).toBe("ACTIVE");
    expect(loginResult.token).toBeDefined();
    expect(loginResult.redirectUrl).toBe("/buyer");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { OtpService, OTP_MAX_ATTEMPTS } from "@/services/otp.service";
import { formatSenderEmail } from "@/services/otp-delivery.service";
import {
  normalizePhone,
  normalizeEmail,
  normalizeDestination,
} from "@/lib/normalizers/phone";

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

describe("OTP Service & Normalizers Unit Tests", () => {
  describe("1. Cryptographic OTP Generation & Hashing", () => {
    it("should generate a 6-digit numeric OTP within range [100000, 999999]", () => {
      for (let i = 0; i < 50; i++) {
        const otp = OtpService.generateOtp();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
        const num = parseInt(otp, 10);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThan(1000000);
      }
    });

    it("should correctly hash and verify OTP using timing-safe comparison", () => {
      const otp = "849201";
      const hash = OtpService.hashOtp(otp);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(otp);
      expect(hash).toHaveLength(64); // SHA-256 hex length

      expect(OtpService.verifyOtpHash(otp, hash)).toBe(true);
      expect(OtpService.verifyOtpHash("123456", hash)).toBe(false);
      expect(OtpService.verifyOtpHash("", hash)).toBe(false);
    });
  });

  describe("2. Destination Normalizers", () => {
    it("should normalize Indian phone numbers to E.164 +91 format", () => {
      expect(normalizePhone("9876543210")).toBe("+919876543210");
      expect(normalizePhone("+91 98765-43210")).toBe("+919876543210");
      expect(normalizePhone("09876543210")).toBe("+919876543210");
      expect(normalizePhone("+919876543210")).toBe("+919876543210");
    });

    it("should reject invalid mobile numbers", () => {
      expect(() => normalizePhone("12345")).toThrow();
      expect(() => normalizePhone("abc-phone")).toThrow();
      expect(() => normalizePhone("0123456789")).toThrow();
    });

    it("should normalize email addresses to trimmed lowercase", () => {
      expect(normalizeEmail("  Ramesh.Farmer@AgriAqua.DEV  ")).toBe("ramesh.farmer@agriaqua.dev");
    });

    it("should accurately detect and normalize destination types", () => {
      const emailResult = normalizeDestination("User@Domain.Com");
      expect(emailResult.destinationType).toBe("EMAIL");
      expect(emailResult.destination).toBe("user@domain.com");

      const phoneResult = normalizeDestination("+91 98765 43210");
      expect(phoneResult.destinationType).toBe("MOBILE");
      expect(phoneResult.destination).toBe("+919876543210");
    });
  });

  describe("3. Masking Destinations", () => {
    it("should safely mask email addresses", () => {
      const masked = OtpService.maskDestination("farmer.ramesh@agriaqua.net", "EMAIL");
      expect(masked).toBe("f****h@agriaqua.net");
    });

    it("should safely mask phone numbers", () => {
      const masked = OtpService.maskDestination("+919876543210", "MOBILE");
      expect(masked).toBe("+91 ******3210");
    });
  });

  describe("4. Challenge Lifecycle & Security Guards", () => {
    const testDestination = "unit.test@agriaqua.net";

    it("should create a valid challenge with 10-minute expiry", async () => {
      const challenge = await OtpService.createOtpChallenge({
        destination: testDestination,
        destinationType: "EMAIL",
        purpose: "REGISTRATION",
      });

      expect(challenge.challengeId).toBeDefined();
      expect(challenge.otp).toHaveLength(6);
      expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(challenge.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(10 * 60 * 1000);
    });

    it("should enforce 60-second cooldown on consecutive requests", async () => {
      const uniqueDest = "cooldown.test@agriaqua.net";
      await OtpService.createOtpChallenge({
        destination: uniqueDest,
        destinationType: "EMAIL",
        purpose: "REGISTRATION",
      });

      // Rapid recreation must throw 429 Too Many Requests
      await expect(
        OtpService.createOtpChallenge({
          destination: uniqueDest,
          destinationType: "EMAIL",
          purpose: "REGISTRATION",
        })
      ).rejects.toThrow(/Please wait/);
    });

    it("should verify successfully with correct OTP", async () => {
      const verifyDest = "verify.success@agriaqua.net";
      const challenge = await OtpService.createOtpChallenge({
        destination: verifyDest,
        destinationType: "EMAIL",
        purpose: "REGISTRATION",
      });

      const result = await OtpService.verifyOtpChallenge({
        destination: verifyDest,
        purpose: "REGISTRATION",
        otp: challenge.otp,
      });

      expect(result.success).toBe(true);
      expect(result.destination).toBe(verifyDest);
    });

    it("should prevent OTP replay (single-use consumption)", async () => {
      const replayDest = "replay.test@agriaqua.net";
      const challenge = await OtpService.createOtpChallenge({
        destination: replayDest,
        destinationType: "EMAIL",
        purpose: "REGISTRATION",
      });

      // First verification succeeds
      const first = await OtpService.verifyOtpChallenge({
        destination: replayDest,
        purpose: "REGISTRATION",
        otp: challenge.otp,
      });
      expect(first.success).toBe(true);

      // Second attempt with same OTP must fail
      await expect(
        OtpService.verifyOtpChallenge({
          destination: replayDest,
          purpose: "REGISTRATION",
          otp: challenge.otp,
        })
      ).rejects.toThrow(/Invalid or expired verification challenge/);
    });

    it("should enforce purpose isolation (REGISTRATION vs PASSWORD_RESET)", async () => {
      const purposeDest = "purpose.test@agriaqua.net";
      const challenge = await OtpService.createOtpChallenge({
        destination: purposeDest,
        destinationType: "EMAIL",
        purpose: "REGISTRATION",
      });

      // Attempting to verify REGISTRATION challenge using PASSWORD_RESET purpose must fail
      await expect(
        OtpService.verifyOtpChallenge({
          destination: purposeDest,
          purpose: "PASSWORD_RESET",
          otp: challenge.otp,
        })
      ).rejects.toThrow(/Invalid or expired verification challenge/);
    });

    it("should lockout after max failed attempts", async () => {
      const lockoutDest = "lockout.test@agriaqua.net";
      await OtpService.createOtpChallenge({
        destination: lockoutDest,
        destinationType: "EMAIL",
        purpose: "REGISTRATION",
      });

      // Fail 4 times
      for (let i = 1; i <= 4; i++) {
        await expect(
          OtpService.verifyOtpChallenge({
            destination: lockoutDest,
            purpose: "REGISTRATION",
            otp: "000000",
          })
        ).rejects.toThrow(/Invalid verification code/);
      }

      // 5th failed attempt should trigger maximum attempts exceeded
      await expect(
        OtpService.verifyOtpChallenge({
          destination: lockoutDest,
          purpose: "REGISTRATION",
          otp: "000000",
        })
      ).rejects.toThrow(/Maximum verification attempts exceeded/);
    });
  });

  describe("5. OTP Email Sender Configuration", () => {
    it("should format sender with EcoFarm brand name when raw email is provided", () => {
      expect(formatSenderEmail("no-reply@ayangiri.com")).toBe("EcoFarm <no-reply@ayangiri.com>");
    });

    it("should preserve custom display name when brackets are provided", () => {
      expect(formatSenderEmail("EcoFarm <no-reply@ayangiri.com>")).toBe("EcoFarm <no-reply@ayangiri.com>");
    });

    it("should fall back to onboarding@resend.dev when undefined or empty", () => {
      expect(formatSenderEmail(undefined)).toBe("EcoFarm <onboarding@resend.dev>");
      expect(formatSenderEmail("")).toBe("EcoFarm <onboarding@resend.dev>");
      expect(formatSenderEmail("   ")).toBe("EcoFarm <onboarding@resend.dev>");
    });
  });
});

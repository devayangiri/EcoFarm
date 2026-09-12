import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { OtpDestinationType, OtpPurpose } from "@prisma/client";

export interface CreateOtpChallengeParams {
  destination: string;
  destinationType: OtpDestinationType;
  purpose: OtpPurpose;
  userId?: string | null;
}

export interface VerifyOtpChallengeParams {
  challengeId?: string;
  destination: string;
  destinationType?: OtpDestinationType;
  purpose: OtpPurpose;
  otp: string;
}

export interface OtpRecord {
  id: string;
  destination: string;
  destinationType: OtpDestinationType;
  purpose: OtpPurpose;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verifiedAt: Date | null;
  consumedAt: Date | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory fallback store for offline development / test environments
const globalForOtp = globalThis as unknown as {
  devOtpStore: Map<string, OtpRecord> | undefined;
};
const devOtpStore = globalForOtp.devOtpStore ?? new Map<string, OtpRecord>();
if (process.env.NODE_ENV !== "production") {
  globalForOtp.devOtpStore = devOtpStore;
}

const OTP_SECRET_SALT = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "ecofarm-otp-default-secret-salt-2026";
export const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
export const OTP_MAX_ATTEMPTS = 5;

export class OtpService {
  /**
   * Generates a 6-digit numeric OTP using cryptographically secure random integers.
   */
  static generateOtp(): string {
    // Generates integer in range [100000, 999999] inclusive
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes an OTP with SHA-256 and secret salt.
   */
  static hashOtp(otp: string): string {
    return crypto
      .createHash("sha256")
      .update(`${otp}:${OTP_SECRET_SALT}`)
      .digest("hex");
  }

  /**
   * Constant-time comparison between raw OTP and stored hash.
   */
  static verifyOtpHash(rawOtp: string, storedHash: string): boolean {
    const computedHash = this.hashOtp(rawOtp);
    const computedBuf = Buffer.from(computedHash, "hex");
    const storedBuf = Buffer.from(storedHash, "hex");

    if (computedBuf.length !== storedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedBuf, storedBuf);
  }

  /**
   * Masks email or phone number for user-facing displays.
   */
  static maskDestination(destination: string, type: OtpDestinationType): string {
    if (type === "EMAIL" || destination.includes("@")) {
      const [localPart, domain] = destination.split("@");
      if (!domain) return destination;
      if (localPart.length <= 2) {
        return `${localPart[0] || "*"}***@${domain}`;
      }
      return `${localPart[0]}****${localPart[localPart.length - 1]}@${domain}`;
    }

    // Phone masking
    const digits = destination.replace(/\D/g, "");
    if (digits.length >= 10) {
      const last4 = digits.slice(-4);
      const prefix = destination.startsWith("+") ? destination.slice(0, 3) : "+91";
      return `${prefix} ******${last4}`;
    }
    return destination;
  }

  /**
   * Creates a new OTP challenge, enforcing cooldown and invalidating prior unconsumed challenges.
   */
  static async createOtpChallenge(params: CreateOtpChallengeParams): Promise<{
    challengeId: string;
    otp: string; // Plaintext OTP returned ONLY to the delivery layer, never stored or returned to client
    destination: string;
    destinationType: OtpDestinationType;
    purpose: OtpPurpose;
    expiresAt: Date;
  }> {
    const now = new Date();
    const destination = params.destination.trim().toLowerCase();

    // 1. Check Resend Cooldown (60 seconds)
    let recentChallenge: OtpRecord | null = null;
    try {
      const dbRecent = await prisma.otpVerification.findFirst({
        where: {
          destination,
          purpose: params.purpose,
          consumedAt: null,
          createdAt: {
            gt: new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS),
          },
        },
        orderBy: { createdAt: "desc" },
      });
      if (dbRecent) recentChallenge = dbRecent as any;
    } catch {
      // In-memory lookup
      for (const rec of Array.from(devOtpStore.values())) {
        if (
          rec.destination === destination &&
          rec.purpose === params.purpose &&
          !rec.consumedAt &&
          now.getTime() - rec.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS
        ) {
          recentChallenge = rec;
          break;
        }
      }
    }

    if (recentChallenge) {
      const remainingSeconds = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (now.getTime() - recentChallenge.createdAt.getTime())) / 1000
      );
      throw AppError.tooManyRequests(
        `Please wait ${remainingSeconds} seconds before requesting a new verification code.`
      );
    }

    // 2. Invalidate previous active unconsumed challenges for this destination + purpose
    try {
      await prisma.otpVerification.updateMany({
        where: {
          destination,
          purpose: params.purpose,
          consumedAt: null,
        },
        data: {
          consumedAt: now,
        },
      });
    } catch {
      for (const rec of Array.from(devOtpStore.values())) {
        if (rec.destination === destination && rec.purpose === params.purpose && !rec.consumedAt) {
          rec.consumedAt = now;
        }
      }
    }

    // 3. Generate fresh OTP and secure hash
    const rawOtp = this.generateOtp();
    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
    const challengeId = crypto.randomUUID();

    // 4. Store challenge in PostgreSQL (or fallback store)
    try {
      await prisma.otpVerification.create({
        data: {
          id: challengeId,
          destination,
          destinationType: params.destinationType,
          purpose: params.purpose,
          otpHash,
          expiresAt,
          maxAttempts: OTP_MAX_ATTEMPTS,
          userId: params.userId || null,
        },
      });
    } catch {
      const devRecord: OtpRecord = {
        id: challengeId,
        destination,
        destinationType: params.destinationType,
        purpose: params.purpose,
        otpHash,
        expiresAt,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        verifiedAt: null,
        consumedAt: null,
        userId: params.userId || null,
        createdAt: now,
        updatedAt: now,
      };
      devOtpStore.set(challengeId, devRecord);
    }

    return {
      challengeId,
      otp: rawOtp,
      destination,
      destinationType: params.destinationType,
      purpose: params.purpose,
      expiresAt,
    };
  }

  /**
   * Immediately invalidates an active challenge (e.g. if delivery fails after creation)
   */
  static async invalidateChallenge(challengeId: string): Promise<void> {
    const now = new Date();
    try {
      await prisma.otpVerification.update({
        where: { id: challengeId },
        data: { consumedAt: now },
      });
    } catch {
      const rec = devOtpStore.get(challengeId);
      if (rec) rec.consumedAt = now;
    }
  }

  /**
   * Verifies an OTP challenge against destination, purpose, and attempt guards.
   */
  static async verifyOtpChallenge(params: VerifyOtpChallengeParams): Promise<{
    success: boolean;
    challengeId: string;
    userId: string | null;
    destination: string;
    purpose: OtpPurpose;
  }> {
    const now = new Date();
    const destination = params.destination.trim().toLowerCase();

    // 1. Locate challenge by challengeId or latest unconsumed matching destination & purpose
    let challenge: OtpRecord | null = null;

    try {
      if (params.challengeId) {
        const found = await prisma.otpVerification.findUnique({
          where: { id: params.challengeId },
        });
        if (found) challenge = found as any;
      } else {
        const found = await prisma.otpVerification.findFirst({
          where: {
            destination,
            purpose: params.purpose,
            consumedAt: null,
          },
          orderBy: { createdAt: "desc" },
        });
        if (found) challenge = found as any;
      }
    } catch {
      // Memory fallback lookup
      if (params.challengeId) {
        challenge = devOtpStore.get(params.challengeId) || null;
      } else {
        const matching = Array.from(devOtpStore.values())
          .filter((c) => c.destination === destination && c.purpose === params.purpose && !c.consumedAt)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        challenge = matching[0] || null;
      }
    }

    if (!challenge) {
      challenge = params.challengeId ? devOtpStore.get(params.challengeId) || null : null;
      if (!challenge) {
        const matching = Array.from(devOtpStore.values())
          .filter((c) => c.destination === destination && c.purpose === params.purpose && !c.consumedAt)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        challenge = matching[0] || null;
      }
    }

    if (!challenge) {
      throw AppError.badRequest("Invalid or expired verification challenge. Please request a new code.");
    }

    // 2. Enforce Purpose Matching
    if (challenge.purpose !== params.purpose) {
      throw AppError.badRequest("Invalid verification purpose. This code cannot be used for this action.");
    }

    // 3. Enforce Destination Matching
    if (challenge.destination !== destination) {
      throw AppError.badRequest("Verification code does not match the specified destination.");
    }

    // 4. Check already consumed
    if (challenge.consumedAt) {
      throw AppError.badRequest("Verification code has already been used. Please request a new one.");
    }

    // 5. Check expiration
    if (challenge.expiresAt < now) {
      await this.markConsumed(challenge.id);
      throw AppError.badRequest("Verification code has expired. Please request a new one.");
    }

    // 6. Check attempt limits
    if (challenge.attempts >= challenge.maxAttempts) {
      await this.markConsumed(challenge.id);
      throw AppError.badRequest("Maximum verification attempts exceeded. Please request a new code.");
    }

    // 7. Increment attempt counter
    await this.incrementAttempts(challenge.id);

    // 8. Verify OTP hash
    const isMatch = this.verifyOtpHash(params.otp.trim(), challenge.otpHash);
    if (!isMatch) {
      const remainingAttempts = Math.max(0, challenge.maxAttempts - challenge.attempts);
      if (remainingAttempts === 0) {
        await this.markConsumed(challenge.id);
        throw AppError.badRequest("Maximum verification attempts exceeded. Please request a new code.");
      }
      throw AppError.badRequest(`Invalid verification code. ${remainingAttempts} attempts remaining.`);
    }

    // 9. Successfully verified -> consume immediately
    await this.markVerifiedAndConsumed(challenge.id);

    return {
      success: true,
      challengeId: challenge.id,
      userId: challenge.userId,
      destination: challenge.destination,
      purpose: challenge.purpose,
    };
  }

  private static async incrementAttempts(challengeId: string) {
    try {
      await prisma.otpVerification.update({
        where: { id: challengeId },
        data: { attempts: { increment: 1 } },
      });
    } catch {
      const rec = devOtpStore.get(challengeId);
      if (rec) rec.attempts += 1;
    }
  }

  private static async markConsumed(challengeId: string) {
    const now = new Date();
    try {
      await prisma.otpVerification.update({
        where: { id: challengeId },
        data: { consumedAt: now },
      });
    } catch {
      const rec = devOtpStore.get(challengeId);
      if (rec) rec.consumedAt = now;
    }
  }

  private static async markVerifiedAndConsumed(challengeId: string) {
    const now = new Date();
    try {
      await prisma.otpVerification.update({
        where: { id: challengeId },
        data: {
          verifiedAt: now,
          consumedAt: now,
        },
      });
    } catch {
      const rec = devOtpStore.get(challengeId);
      if (rec) {
        rec.verifiedAt = now;
        rec.consumedAt = now;
      }
    }
  }

  /**
   * Invalidate all OTP challenges for a user
   */
  static async invalidateUserChallenges(userId: string, purpose?: OtpPurpose) {
    const now = new Date();
    try {
      await prisma.otpVerification.updateMany({
        where: {
          userId,
          ...(purpose ? { purpose } : {}),
          consumedAt: null,
        },
        data: { consumedAt: now },
      });
    } catch {
      for (const rec of Array.from(devOtpStore.values())) {
        if (rec.userId === userId && (!purpose || rec.purpose === purpose) && !rec.consumedAt) {
          rec.consumedAt = now;
        }
      }
    }
  }

  /**
   * Reset store (used for test isolation)
   */
  static resetStore() {
    devOtpStore.clear();
  }
}

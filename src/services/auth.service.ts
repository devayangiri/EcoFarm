import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/rbac";
import { PUBLIC_ROLES } from "@/types/role.types";
import {
  normalizeEmail,
  normalizePhone,
  normalizeDestination,
} from "@/lib/normalizers/phone";
import { OtpService } from "@/services/otp.service";
import { OtpDeliveryService } from "@/services/otp-delivery.service";
import type { RegisterInput, LoginInput } from "@/lib/validators/auth.schema";
import type { UserRole, UserSession, UserStatus } from "@/types/role.types";
import type { OtpDestinationType } from "@prisma/client";

interface DevUserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  tokenVersion: number;
  createdAt: Date;
  lastLoginAt: Date | null;
}

const globalForAuth = globalThis as unknown as {
  devUserStore: Map<string, DevUserRecord> | undefined;
};

// In-memory development store for offline local preview (attached to globalThis for Next.js multi-bundle persistence)
const devUserStore = globalForAuth.devUserStore ?? new Map<string, DevUserRecord>();
if (process.env.NODE_ENV !== "production") {
  globalForAuth.devUserStore = devUserStore;
}

export class AuthService {
  /**
   * Registers a new user with an allowed public role
   */
  static async register(input: RegisterInput) {
    // 1. Strict Server-Side Guard: Block ADMIN self-registration
    if (!PUBLIC_ROLES.includes(input.role as UserRole)) {
      throw AppError.forbidden("Administrative accounts cannot be created via public registration");
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const normalizedPhone = input.phone?.trim() || null;

    // Check duplicate in dev fallback store
    for (const u of Array.from(devUserStore.values())) {
      if (u.email === normalizedEmail) {
        throw AppError.conflict("An account with this email address already exists");
      }
      if (normalizedPhone && u.phone === normalizedPhone) {
        throw AppError.conflict("An account with this phone number already exists");
      }
    }

    // 2. Check for duplicate email in DB if reachable
    try {
      const existingEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingEmail) {
        throw AppError.conflict("An account with this email address already exists");
      }

      // 3. Check for duplicate phone (if provided)
      if (normalizedPhone) {
        const existingPhone = await prisma.user.findUnique({
          where: { phone: normalizedPhone },
        });
        if (existingPhone) {
          throw AppError.conflict("An account with this phone number already exists");
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.warn("AuthService.register: Database unreachable, using local fallback store");
    }

    // 4. Hash password with bcrypt (12 rounds)
    const passwordHash = await hashPassword(input.password);

    let user: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
      role: UserRole;
      status: UserStatus;
      tokenVersion: number;
      createdAt: Date;
    };

    // 5. Create user in PostgreSQL (or fallback store)
    try {
      const createdUser = await prisma.user.create({
        data: {
          fullName: input.fullName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          role: input.role as UserRole,
          status: "PENDING_VERIFICATION",
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          tokenVersion: true,
          createdAt: true,
        },
      });
      user = createdUser as any;
    } catch (err) {
      console.warn("AuthService: Creating user in local fallback store:", err instanceof Error ? err.message : err);
      const devRecord: DevUserRecord = {
        id: `dev-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        role: input.role as UserRole,
        status: "PENDING_VERIFICATION",
        tokenVersion: 0,
        createdAt: new Date(),
        lastLoginAt: null,
      };
      devUserStore.set(devRecord.id, devRecord);
      devUserStore.set(devRecord.email, devRecord);
      if (devRecord.phone) devUserStore.set(devRecord.phone, devRecord);

      user = {
        id: devRecord.id,
        fullName: devRecord.fullName,
        email: devRecord.email,
        phone: devRecord.phone,
        role: devRecord.role,
        status: devRecord.status,
        tokenVersion: devRecord.tokenVersion,
        createdAt: devRecord.createdAt,
      };
    }

    // 6. Generate signed JWT session
    const sessionData: UserSession = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as UserRole,
      status: user.status as UserSession["status"],
      tokenVersion: user.tokenVersion,
    };

    const token = await createSessionToken(sessionData);
    const redirectUrl = getRoleDashboardPath(user.role as UserRole);

    return {
      user,
      token,
      redirectUrl,
    };
  }

  /**
   * Authenticates user via email/phone and password
   */
  static async login(input: LoginInput) {
    const identifier = input.identifier.trim();
    const isEmail = identifier.includes("@");

    let user: any = null;

    // 1. Find user by email or phone in DB
    try {
      user = await prisma.user.findFirst({
        where: isEmail
          ? { email: identifier.toLowerCase() }
          : { phone: identifier },
      });
    } catch {
      // Fallback store lookup
      user = devUserStore.get(isEmail ? identifier.toLowerCase() : identifier);
    }

    if (!user) {
      user = devUserStore.get(isEmail ? identifier.toLowerCase() : identifier);
    }

    // 2. Generic failure message to prevent username enumeration
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized("Invalid email/phone or password");
    }

    // 3. Verify password
    const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid email/phone or password");
    }

    // 4. Reject suspended accounts immediately
    if (user.status === "SUSPENDED") {
      throw AppError.forbidden("Your account has been suspended. Please contact platform support.");
    }

    // 5. Update last login timestamp
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch {
      if (user.id) {
        const record = devUserStore.get(user.id);
        if (record) record.lastLoginAt = new Date();
      }
    }

    // 6. Generate signed JWT session
    const sessionData: UserSession = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as UserRole,
      status: user.status as UserSession["status"],
      // Preserve exact database tokenVersion (default 0) without coercion to avoid SSR rejection
      tokenVersion: typeof user.tokenVersion === "number" ? user.tokenVersion : 0,
    };

    const token = await createSessionToken(sessionData);
    const redirectUrl = getRoleDashboardPath(user.role as UserRole);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
      token,
      redirectUrl,
    };
  }

  /**
   * Retrieves safe current user profile by user ID
   */
  static async getMe(userId: string) {
    let user: any = null;

    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });
    } catch {
      user = devUserStore.get(userId);
    }

    if (!user) {
      user = devUserStore.get(userId);
    }

    if (!user) {
      throw AppError.notFound("User not found");
    }

    if (user.status === "SUSPENDED") {
      throw AppError.forbidden("Account suspended");
    }

    return user;
  }

  /**
   * Initiates registration with OTP challenge dispatch
   */
  static async initiateRegistration(
    input: RegisterInput,
    options?: { destinationType?: OtpDestinationType }
  ) {
    if (!PUBLIC_ROLES.includes(input.role as UserRole)) {
      throw AppError.forbidden("Administrative accounts cannot be created via public registration");
    }

    const normalizedEmail = normalizeEmail(input.email);
    const normalizedPhone = input.phone ? normalizePhone(input.phone) : null;

    // Check duplicate in dev fallback store
    for (const u of Array.from(devUserStore.values())) {
      if (u.email === normalizedEmail && u.status === "ACTIVE") {
        throw AppError.conflict("An account with this email address already exists");
      }
      if (normalizedPhone && u.phone === normalizedPhone && u.status === "ACTIVE") {
        throw AppError.conflict("An account with this phone number already exists");
      }
    }

    // Check for duplicate email in DB if reachable
    try {
      const existingEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingEmail && existingEmail.status === "ACTIVE") {
        throw AppError.conflict("An account with this email address already exists");
      }

      if (normalizedPhone) {
        const existingPhone = await prisma.user.findUnique({
          where: { phone: normalizedPhone },
        });
        if (existingPhone && existingPhone.status === "ACTIVE") {
          throw AppError.conflict("An account with this phone number already exists");
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.warn("AuthService.initiateRegistration: Database unreachable, checking fallback store");
    }

    const passwordHash = await hashPassword(input.password);
    let user: any = null;

    // Create or update PENDING_VERIFICATION user
    try {
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing && existing.status === "PENDING_VERIFICATION") {
        user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            fullName: input.fullName.trim(),
            passwordHash,
            phone: normalizedPhone,
            role: input.role as UserRole,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            fullName: input.fullName.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
            role: input.role as UserRole,
            status: "PENDING_VERIFICATION",
          },
        });
      }
    } catch {
      let existing = devUserStore.get(normalizedEmail);
      if (existing && existing.status === "PENDING_VERIFICATION") {
        existing.fullName = input.fullName.trim();
        existing.passwordHash = passwordHash;
        existing.phone = normalizedPhone;
        existing.role = input.role as UserRole;
        user = existing;
      } else {
        const devRecord: DevUserRecord = {
          id: `dev-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fullName: input.fullName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          role: input.role as UserRole,
          status: "PENDING_VERIFICATION",
          tokenVersion: 0,
          createdAt: new Date(),
          lastLoginAt: null,
        };
        devUserStore.set(devRecord.id, devRecord);
        devUserStore.set(devRecord.email, devRecord);
        if (devRecord.phone) devUserStore.set(devRecord.phone, devRecord);
        user = devRecord;
      }
    }

    // Determine verification destination
    const destType: OtpDestinationType =
      options?.destinationType === "MOBILE" && normalizedPhone ? "MOBILE" : "EMAIL";
    const destination = destType === "MOBILE" ? normalizedPhone! : normalizedEmail;

    // Create OTP challenge
    const challenge = await OtpService.createOtpChallenge({
      destination,
      destinationType: destType,
      purpose: "REGISTRATION",
      userId: user.id,
    });

    // Send OTP via abstraction
    await OtpDeliveryService.sendOtp({
      destination,
      destinationType: destType,
      otp: challenge.otp,
      purpose: "REGISTRATION",
    });

    return {
      userId: user.id,
      verificationToken: challenge.challengeId,
      destination: OtpService.maskDestination(destination, destType),
      destinationRaw: destination,
      destinationType: destType,
      expiresAt: challenge.expiresAt,
    };
  }

  /**
   * Verifies registration OTP and activates the user account
   */
  static async verifyRegistrationOtp(params: {
    verificationToken?: string;
    destination: string;
    destinationType?: OtpDestinationType;
    purpose?: string;
    otp: string;
  }) {
    const verified = await OtpService.verifyOtpChallenge({
      challengeId: params.verificationToken,
      destination: params.destination,
      destinationType: params.destinationType,
      purpose: "REGISTRATION",
      otp: params.otp,
    });

    let user: any = null;

    try {
      if (verified.userId) {
        user = await prisma.user.findUnique({
          where: { id: verified.userId },
        });
      }
      if (!user) {
        user = await prisma.user.findFirst({
          where: {
            OR: [{ email: verified.destination }, { phone: verified.destination }],
          },
        });
      }

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            status: "ACTIVE",
            ...(verified.destination.includes("@")
              ? { emailVerifiedAt: new Date() }
              : { phoneVerifiedAt: new Date() }),
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            tokenVersion: true,
            createdAt: true,
          },
        });
      }
    } catch {
      if (verified.userId) {
        user = devUserStore.get(verified.userId);
      }
      if (!user) {
        user = devUserStore.get(verified.destination);
      }
      if (user) {
        user.status = "ACTIVE";
      }
    }

    if (!user) {
      throw AppError.notFound("User registration record could not be found");
    }

    const sessionData: UserSession = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as UserRole,
      status: "ACTIVE",
      tokenVersion: typeof user.tokenVersion === "number" ? user.tokenVersion : 0,
    };

    const token = await createSessionToken(sessionData);
    const redirectUrl = getRoleDashboardPath(user.role as UserRole);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: "ACTIVE",
        createdAt: user.createdAt,
      },
      token,
      redirectUrl,
    };
  }

  /**
   * Resends registration OTP challenge
   */
  static async resendRegistrationOtp(params: {
    verificationToken?: string;
    destination?: string;
    destinationType?: OtpDestinationType;
  }) {
    let destination = params.destination?.trim().toLowerCase();
    let destinationType: OtpDestinationType = params.destinationType || "EMAIL";
    let userId: string | null = null;

    if (params.verificationToken) {
      try {
        const challenge = await prisma.otpVerification.findUnique({
          where: { id: params.verificationToken },
        });
        if (challenge) {
          destination = challenge.destination;
          destinationType = challenge.destinationType;
          userId = challenge.userId;
        }
      } catch {
        // Memory fallback
      }
    }

    if (!destination) {
      throw AppError.badRequest("Destination or verification token is required to resend code");
    }

    const challenge = await OtpService.createOtpChallenge({
      destination,
      destinationType,
      purpose: "REGISTRATION",
      userId,
    });

    await OtpDeliveryService.sendOtp({
      destination,
      destinationType,
      otp: challenge.otp,
      purpose: "REGISTRATION",
    });

    return {
      success: true,
      verificationToken: challenge.challengeId,
      destination: OtpService.maskDestination(destination, destinationType),
      destinationType,
      expiresAt: challenge.expiresAt,
    };
  }

  /**
   * Requests password reset OTP (Generic response to prevent user enumeration)
   */
  static async requestPasswordResetOtp(identifier: string) {
    let normalized = "";
    let destType: OtpDestinationType = "EMAIL";

    try {
      const dest = normalizeDestination(identifier);
      normalized = dest.destination;
      destType = dest.destinationType;
    } catch {
      // Return generic message even on malformed input to avoid leaking format expectations
      return {
        success: true,
        message: "If the account exists, a verification code has been sent.",
        data: {
          destination: identifier,
          destinationType: "EMAIL" as const,
        },
      };
    }

    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: destType === "EMAIL" ? { email: normalized } : { phone: normalized },
      });
    } catch {
      user = devUserStore.get(normalized);
    }

    if (!user) {
      user = devUserStore.get(normalized);
    }

    // Only dispatch if user exists and is not suspended
    if (user && user.status !== "SUSPENDED") {
      try {
        const challenge = await OtpService.createOtpChallenge({
          destination: normalized,
          destinationType: destType,
          purpose: "PASSWORD_RESET",
          userId: user.id,
        });

        await OtpDeliveryService.sendOtp({
          destination: normalized,
          destinationType: destType,
          otp: challenge.otp,
          purpose: "PASSWORD_RESET",
        });
      } catch (err) {
        if (err instanceof AppError && err.statusCode === 429) {
          throw err;
        }
        console.error("Error creating/sending password reset challenge:", err);
      }
    }

    return {
      success: true,
      message: "If the account exists, a verification code has been sent.",
      data: {
        destination: OtpService.maskDestination(normalized, destType),
        destinationType: destType,
      },
    };
  }

  /**
   * Verifies password reset OTP and generates a purpose-bound reset token
   */
  static async verifyPasswordResetOtp(identifier: string, otp: string) {
    const { destination, destinationType } = normalizeDestination(identifier);

    const verified = await OtpService.verifyOtpChallenge({
      destination,
      destinationType,
      purpose: "PASSWORD_RESET",
      otp,
    });

    let user: any = null;
    try {
      if (verified.userId) {
        user = await prisma.user.findUnique({
          where: { id: verified.userId },
        });
      }
      if (!user) {
        user = await prisma.user.findFirst({
          where: destinationType === "EMAIL" ? { email: destination } : { phone: destination },
        });
      }
    } catch {
      user = devUserStore.get(destination);
    }

    if (!user) {
      user = devUserStore.get(destination);
    }

    if (!user || user.status === "SUSPENDED") {
      throw AppError.badRequest("Invalid or expired verification challenge. Please request a new code.");
    }

    const resetToken = await createPasswordResetToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
    });

    return {
      success: true,
      resetToken,
    };
  }

  /**
   * Resets password using validated resetToken and revokes existing sessions
   */
  static async resetPassword(resetToken: string, newPassword: string) {
    const payload = await verifyPasswordResetToken(resetToken);
    if (!payload || !payload.userId) {
      throw AppError.unauthorized(
        "Invalid or expired password reset token. Please request a new verification code."
      );
    }

    const passwordHash = await hashPassword(newPassword);
    let user: any = null;

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!existingUser) {
        throw AppError.notFound("Account not found");
      }

      // Update password and increment tokenVersion to revoke all active sessions
      user = await prisma.user.update({
        where: { id: payload.userId },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      });

      // Invalidate all remaining active PASSWORD_RESET OTP challenges for this user
      await OtpService.invalidateUserChallenges(payload.userId, "PASSWORD_RESET");
    } catch (err) {
      if (err instanceof AppError) throw err;
      const devRecord = devUserStore.get(payload.userId);
      if (devRecord) {
        devRecord.passwordHash = passwordHash;
        devRecord.tokenVersion = (devRecord.tokenVersion || 0) + 1;
        user = devRecord;
        await OtpService.invalidateUserChallenges(payload.userId, "PASSWORD_RESET");
      }
    }

    if (!user) {
      throw AppError.notFound("Account not found");
    }

    return {
      success: true,
      message: "Password has been successfully reset. Please sign in with your new password.",
    };
  }
}

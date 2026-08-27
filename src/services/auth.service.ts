import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword, createSessionToken } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/rbac";
import { PUBLIC_ROLES } from "@/types/role.types";
import type { RegisterInput, LoginInput } from "@/lib/validators/auth.schema";
import type { UserRole, UserSession } from "@/types/role.types";

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

    // 2. Check for duplicate email
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

    // 4. Hash password with bcrypt (12 rounds)
    const passwordHash = await hashPassword(input.password);

    // 5. Create user in PostgreSQL
    const user = await prisma.user.create({
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

    // 1. Find user by email or phone
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: identifier.toLowerCase() }
        : { phone: identifier },
    });

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
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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
    const user = await prisma.user.findUnique({
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

    if (!user) {
      throw AppError.notFound("User not found");
    }

    if (user.status === "SUSPENDED") {
      throw AppError.forbidden("Account suspended");
    }

    return user;
  }
}

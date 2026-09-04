import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword, createSessionToken } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/rbac";
import { PUBLIC_ROLES } from "@/types/role.types";
import type { RegisterInput, LoginInput } from "@/lib/validators/auth.schema";
import type { UserRole, UserSession, UserStatus } from "@/types/role.types";

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
}

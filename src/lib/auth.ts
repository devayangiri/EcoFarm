import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { UserSession, UserRole, UserStatus } from "@/types/role.types";

export const SESSION_COOKIE_NAME = "agri_aqua_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || "agri-aqua-network-phase-1-dev-secret-key-change-in-prod";
  return new Uint8Array(Buffer.from(secret, "utf-8"));
}

/**
 * Hashes a plaintext password using bcrypt with salt rounds = 12
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password with stored hash safely
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a signed, tamper-proof JWT containing safe session claims
 */
export async function createSessionToken(session: UserSession): Promise<string> {
  const secretKey = getJwtSecretKey();
  
  return new SignJWT({
    userId: session.userId,
    email: session.email,
    fullName: session.fullName,
    phone: session.phone ?? null,
    role: session.role,
    status: session.status,
    tokenVersion: session.tokenVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .setSubject(session.userId)
    .sign(secretKey);
}

/**
 * Verifies a JWT token and returns safe session data, or null if expired/invalid
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (!payload.userId || !payload.role || !payload.status) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: (payload.email as string) || "",
      fullName: (payload.fullName as string) || "",
      phone: (payload.phone as string | null) || null,
      role: payload.role as UserRole,
      status: payload.status as UserStatus,
      tokenVersion: typeof payload.tokenVersion === "number" ? payload.tokenVersion : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Cookie option generator for production-grade HTTP-only cookies
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}

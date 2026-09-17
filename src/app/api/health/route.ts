import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDatabaseSchema } from "@/lib/db-sync";
import { formatSenderEmail, getLastOtpDebugState } from "@/services/otp-delivery.service";
import { getLastPasswordResetAttempt, getLastLoginAttempt } from "@/services/auth.service";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse>;
export async function GET(request: Request): Promise<NextResponse>;
export async function GET(request?: Request): Promise<NextResponse> {
  let dbStatus = "unreachable";
  
  try {
    // Probing database connection safely with timeout fallback
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
    ]);
    dbStatus = "connected";
  } catch {
    dbStatus = "disconnected";
  }

  // Ensure missing columns/tables are created if needed
  let schemaSyncResult: any = null;
  if (dbStatus === "connected") {
    schemaSyncResult = await ensureDatabaseSchema();
  }

  let probeResult: any = null;
  const url = request ? new URL(request.url) : null;
  const probeAccount = url?.searchParams.get("probeAccount")?.trim().toLowerCase();
  if (probeAccount) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: probeAccount },
            { phone: probeAccount },
          ],
        },
        select: {
          id: true,
          role: true,
          status: true,
          tokenVersion: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          createdAt: true,
          passwordHash: true,
        },
      });

      const dbOtps = await prisma.otpVerification.findMany({
        where: {
          destination: probeAccount,
        },
        select: {
          id: true,
          purpose: true,
          consumedAt: true,
          expiresAt: true,
          attempts: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      probeResult = {
        accountFound: !!dbUser,
        userStatus: dbUser?.status || null,
        userRole: dbUser?.role || null,
        tokenVersion: dbUser?.tokenVersion ?? null,
        hasEmailVerifiedAt: !!dbUser?.emailVerifiedAt,
        hasPhoneVerifiedAt: !!dbUser?.phoneVerifiedAt,
        hasPasswordHash: !!dbUser?.passwordHash,
        otpCount: dbOtps.length,
        recentOtps: dbOtps.map((o) => ({
          purpose: o.purpose,
          consumed: !!o.consumedAt,
          expired: o.expiresAt < new Date(),
          attempts: o.attempts,
          createdAt: o.createdAt,
        })),
      };
    } catch (err: any) {
      probeResult = { error: "Database probe query failed", message: err?.message };
    }
  }

  const rawKey = process.env.RESEND_API_KEY || process.env.OTP_EMAIL_API_KEY;
  const rawFrom = process.env.OTP_EMAIL_FROM;

  const responseBody: ApiResponse<any> = {
    success: true,
    data: {
      status: "ok",
      service: "agri-aqua-api",
      version: "0.1.0",
      database: dbStatus,
      timestamp: new Date().toISOString(),
      runtimeConfig: {
        resendApiKeyConfigured: Boolean(rawKey && rawKey.trim().length > 0),
        otpEmailFromConfigured: Boolean(rawFrom && rawFrom.trim().length > 0),
        fromEmailFormatted: formatSenderEmail(rawFrom),
        nodeEnv: process.env.NODE_ENV || "unknown",
      },
      diagnostics: {
        schemaSync: schemaSyncResult,
        lastPasswordResetAttempt: getLastPasswordResetAttempt(),
        lastLoginAttempt: getLastLoginAttempt(),
        lastOtpDebug: getLastOtpDebugState(),
      },
      ...(probeResult ? { probeResult } : {}),
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}

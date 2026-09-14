import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLastOtpDebugState, formatSenderEmail } from "@/services/otp-delivery.service";
import { getLastPasswordResetAttempt } from "@/services/auth.service";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const responseBody: ApiResponse<{
    status: string;
    service: string;
    version: string;
    database: string;
    timestamp: string;
    runtimeConfig: {
      RESEND_API_KEY: string;
      OTP_EMAIL_API_KEY: string;
      OTP_EMAIL_FROM: string;
      OTP_PROVIDER: string;
      OTP_DEV_MODE: string;
      fromEmailFormatted: string;
      nodeEnv: string;
    };
    diagnostics: {
      lastPasswordResetAttempt: ReturnType<typeof getLastPasswordResetAttempt>;
      lastOtpDebug: ReturnType<typeof getLastOtpDebugState>;
    };
  }> = {
    success: true,
    data: {
      status: "ok",
      service: "agri-aqua-api",
      version: "0.1.0",
      database: dbStatus,
      timestamp: new Date().toISOString(),
      runtimeConfig: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? "SET" : "NOT SET",
        OTP_EMAIL_API_KEY: process.env.OTP_EMAIL_API_KEY ? "SET" : "NOT SET",
        OTP_EMAIL_FROM: process.env.OTP_EMAIL_FROM ? "SET" : "NOT SET",
        OTP_PROVIDER: process.env.OTP_PROVIDER ? "SET" : "NOT SET",
        OTP_DEV_MODE: process.env.OTP_DEV_MODE ? "SET" : "NOT SET",
        fromEmailFormatted: formatSenderEmail(process.env.OTP_EMAIL_FROM),
        nodeEnv: process.env.NODE_ENV || "unknown",
      },
      diagnostics: {
        lastPasswordResetAttempt: getLastPasswordResetAttempt(),
        lastOtpDebug: getLastOtpDebugState(),
      },
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}

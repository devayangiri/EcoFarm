import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

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
  }> = {
    success: true,
    data: {
      status: "ok",
      service: "agri-aqua-api",
      version: "0.1.0",
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}

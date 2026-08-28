import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

export async function GET() {
  let databaseReady = false;

  try {
    // Probe database connection with a 2-second timeout guard
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 2000)),
    ]);
    databaseReady = true;
  } catch {
    databaseReady = false;
  }

  const isReady = databaseReady;

  const responseBody: ApiResponse<{
    ready: boolean;
    checks: {
      database: "connected" | "disconnected";
      storage: "configured";
    };
    timestamp: string;
  }> = {
    success: isReady,
    data: {
      ready: isReady,
      checks: {
        database: databaseReady ? "connected" : "disconnected",
        storage: "configured",
      },
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(responseBody, {
    status: isReady ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

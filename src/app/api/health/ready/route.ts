import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  let databaseReady = false;
  let migrations: string[] = [];
  let schemaChecks: Record<string, boolean> = {};

  try {
    // Probe database connection with a 2-second timeout guard
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB Timeout")), 2000)),
    ]);
    databaseReady = true;

    // Inspect applied migrations from _prisma_migrations
    try {
      const migRows = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY started_at ASC
      `;
      migrations = migRows.map((r) => r.migration_name);
    } catch {
      migrations = [];
    }

    // Inspect critical columns on network_profiles
    try {
      const colRows = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'network_profiles' AND column_name IN ('participantType', 'businessCategory', 'sector', 'district', 'state', 'avatarUrl', 'isVerified')
      `;
      schemaChecks.networkProfilesColumns = colRows.length === 7;
    } catch {
      schemaChecks.networkProfilesColumns = false;
    }
  } catch {
    databaseReady = false;
  }

  const isReady = databaseReady;

  const responseBody: ApiResponse<{
    ready: boolean;
    checks: {
      database: "connected" | "disconnected";
      storage: "configured";
      migrations?: string[];
      schemaChecks?: Record<string, boolean>;
    };
    timestamp: string;
  }> = {
    success: isReady,
    data: {
      ready: isReady,
      checks: {
        database: databaseReady ? "connected" : "disconnected",
        storage: "configured",
        migrations,
        schemaChecks,
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

import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

const startTime = Date.now();

export const dynamic = "force-dynamic";

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const responseBody: ApiResponse<{
    status: "healthy";
    uptime: number;
    timestamp: string;
  }> = {
    success: true,
    data: {
      status: "healthy",
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(responseBody, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

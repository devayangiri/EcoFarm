import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: {
      message: "Logged out successfully",
    },
  };

  return NextResponse.json(response, { status: 200 });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import type { ApiResponse } from "@/types/api";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      const errResponse: ApiResponse = {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
      return NextResponse.json(errResponse, { status: 401 });
    }

    const successResponse: ApiResponse<{ user: typeof user }> = {
      success: true,
      data: { user },
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to retrieve current user" },
      },
      { status: 500 }
    );
  }
}

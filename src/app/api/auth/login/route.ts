import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validators/auth.schema";
import { AuthService } from "@/services/auth.service";
import { AppError } from "@/lib/errors";
import { getSessionCookieOptions } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      const firstErrorMessage = Object.values(fieldErrors)[0]?.[0] || "Validation failed";
      
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: firstErrorMessage,
          details: fieldErrors,
        },
      };
      return NextResponse.json(errorResponse, { status: 422 });
    }

    const { user, token, redirectUrl } = await AuthService.login(parseResult.data);

    // Set secure HTTP-only session cookie
    const cookieStore = cookies();
    const cookieOptions = getSessionCookieOptions();
    cookieStore.set(cookieOptions.name, token, cookieOptions);

    const successResponse: ApiResponse<{
      user: typeof user;
      redirectUrl: string;
    }> = {
      success: true,
      data: {
        user,
        redirectUrl,
      },
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error: any) {
    if (error instanceof AppError) {
      const errResponse: ApiResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
      return NextResponse.json(errResponse, { status: error.statusCode });
    }

    console.error("Unhandled Login Error:", error);
    const serverErrResponse: ApiResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during login. Please try again.",
      },
    };
    return NextResponse.json(serverErrResponse, { status: 500 });
  }
}

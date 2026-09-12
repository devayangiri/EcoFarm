import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRegistrationOtpSchema } from "@/lib/validators/auth.schema";
import { AuthService } from "@/services/auth.service";
import { AppError } from "@/lib/errors";
import { getSessionCookieOptions } from "@/lib/auth";
import { RateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = RateLimiter.check(`otp_verify:${ip}`, RATE_LIMIT_CONFIGS.AUTH_OTP_VERIFY);
    if (!rateLimit.success) {
      return RateLimiter.createTooManyRequestsResponse(rateLimit);
    }

    const body = await request.json();
    const parseResult = verifyRegistrationOtpSchema.safeParse(body);

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

    const { user, token, redirectUrl } = await AuthService.verifyRegistrationOtp(parseResult.data);

    // Set secure HTTP-only session cookie
    const cookieStore = cookies();
    const cookieOptions = getSessionCookieOptions();
    cookieStore.set(cookieOptions.name, token, cookieOptions);

    const successResponse: ApiResponse<{
      user: typeof user;
      redirectUrl: string;
    }> = {
      success: true,
      message: "Account verified and activated successfully.",
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

    console.error("Unhandled Registration OTP Verification Error:", error);
    const serverErrResponse: ApiResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during verification. Please try again.",
      },
    };
    return NextResponse.json(serverErrResponse, { status: 500 });
  }
}

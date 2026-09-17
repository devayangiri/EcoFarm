import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { AppError, isAppError } from "@/lib/errors";
import { RateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = RateLimiter.check(`forgot_pwd_resend:${ip}`, RATE_LIMIT_CONFIGS.AUTH_OTP_REQUEST);
    if (!rateLimit.success) {
      return RateLimiter.createTooManyRequestsResponse(rateLimit);
    }

    const body = await request.json().catch(() => ({}));
    const identifier = (body.identifier || body.destination || "").trim();

    if (!identifier) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please enter your registered email or mobile number",
        },
      };
      return NextResponse.json(errorResponse, { status: 422 });
    }

    const result = await AuthService.requestPasswordResetOtp(identifier);

    const successResponse: ApiResponse = {
      success: true,
      message: "A new verification code has been dispatched if the account exists.",
      data: result.data,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error: any) {
    if (isAppError(error)) {
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

    console.error("Unhandled Forgot Password Resend OTP Error:", error);
    const genericResponse: ApiResponse = {
      success: true,
      message: "If the account exists, a verification code has been sent.",
    };
    return NextResponse.json(genericResponse, { status: 200 });
  }
}

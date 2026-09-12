import { NextResponse } from "next/server";
import { forgotPasswordRequestSchema } from "@/lib/validators/auth.schema";
import { AuthService } from "@/services/auth.service";
import { AppError } from "@/lib/errors";
import { RateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = RateLimiter.check(`forgot_pwd_request:${ip}`, RATE_LIMIT_CONFIGS.AUTH_OTP_REQUEST);
    if (!rateLimit.success) {
      return RateLimiter.createTooManyRequestsResponse(rateLimit);
    }

    const body = await request.json();
    const parseResult = forgotPasswordRequestSchema.safeParse(body);

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

    const result = await AuthService.requestPasswordResetOtp(parseResult.data.identifier);

    const successResponse: ApiResponse = {
      success: true,
      message: result.message,
      data: result.data,
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

    console.error("Unhandled Forgot Password Request OTP Error:", error);
    const genericResponse: ApiResponse = {
      success: true,
      message: "If the account exists, a verification code has been sent.",
    };
    return NextResponse.json(genericResponse, { status: 200 });
  }
}

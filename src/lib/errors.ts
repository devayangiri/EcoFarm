import { NextResponse } from "next/server";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INSUFFICIENT_INVENTORY"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static validation(message: string, details?: unknown) {
    return new AppError("VALIDATION_ERROR", message, 422, details);
  }

  static unauthorized(message: string = "Authentication required") {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message: string = "Access denied") {
    return new AppError("FORBIDDEN", message, 403);
  }

  static notFound(message: string = "Resource not found") {
    return new AppError("NOT_FOUND", message, 404);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError("CONFLICT", message, 409, details);
  }

  static businessRule(message: string, details?: unknown) {
    return new AppError("CONFLICT", message, 400, details);
  }

  static internal(message: string = "Internal server error") {
    return new AppError("INTERNAL_ERROR", message, 500);
  }

  static serviceUnavailable(message: string = "Service temporarily unavailable", details?: unknown) {
    return new AppError("SERVICE_UNAVAILABLE", message, 503, details);
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod schema validation errors with HTTP 422
  if (error && typeof error === "object" && (error instanceof Error || (error as any).name === "ZodError")) {
    const isZod = (error as any).name === "ZodError" || "issues" in error;
    if (isZod) {
      const fieldErrors: Record<string, string[]> = typeof (error as any).flatten === "function" ? (error as any).flatten().fieldErrors : {};
      const firstErrorMessage = Object.values(fieldErrors)[0]?.[0] || (error as Error).message || "Validation failed";
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: firstErrorMessage,
            details: fieldErrors,
          },
        },
        { status: 422 }
      );
    }
  }

  // Detect database connectivity and initialization outages (Section 20: return 503)
  const isDbUnavailable =
    (error &&
      typeof error === "object" &&
      "name" in error &&
      (error.name === "PrismaClientInitializationError" ||
        error.name === "PrismaClientRustPanicError" ||
        (error as any).code === "P1001" ||
        (error as any).code === "P1002" ||
        (error as any).code === "P1008" ||
        (error as any).code === "P1017")) ||
    (error instanceof Error && error.message.includes("Can't reach database server"));

  if (isDbUnavailable) {
    console.error("[DependencyError] Database service unavailable:", {
      name: (error as any).name,
      code: (error as any).code,
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Database service is temporarily unavailable. Please retry shortly.",
        },
      },
      { status: 503 }
    );
  }

  console.error("Unhandled server error:", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected internal server error occurred",
      },
    },
    { status: 500 }
  );
}
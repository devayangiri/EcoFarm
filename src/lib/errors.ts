export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INSUFFICIENT_INVENTORY"
  | "INTERNAL_ERROR";

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

  static internal(message: string = "Internal server error") {
    return new AppError("INTERNAL_ERROR", message, 500);
  }
}

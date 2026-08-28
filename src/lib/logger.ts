export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  actorUserId?: string;
  route?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  resource?: string;
  resourceId?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "cardnumber",
  "card_number",
  "cvv",
  "otp",
  "privatekey",
  "private_key",
];

export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") {
    // Check if string looks like bearer token
    if (data.toLowerCase().startsWith("bearer ")) {
      return "Bearer [REDACTED]";
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }
  if (typeof data === "object") {
    const redactedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
        redactedObj[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        redactedObj[key] = redactSensitiveData(value);
      } else {
        redactedObj[key] = value;
      }
    }
    return redactedObj;
  }
  return data;
}

export class Logger {
  private static formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const cleanContext = context ? (redactSensitiveData(context) as LogContext) : {};

    return JSON.stringify({
      timestamp,
      level,
      message,
      service: "agri-aqua-network",
      environment: process.env.NODE_ENV || "development",
      ...cleanContext,
    });
  }

  static debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatLog("debug", message, context));
    }
  }

  static info(message: string, context?: LogContext) {
    console.info(this.formatLog("info", message, context));
  }

  static warn(message: string, context?: LogContext) {
    console.warn(this.formatLog("warn", message, context));
  }

  static error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorDetails =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
        : { errorMessage: String(error) };

    console.error(
      this.formatLog("error", message, {
        ...context,
        ...errorDetails,
      })
    );
  }
}

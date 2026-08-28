import { NextResponse } from "next/server";

export interface RateLimitConfig {
  limit: number; // Max requests
  windowMs: number; // Window duration in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
}

// In-Memory Sliding Window Store for Single-Process/Development/Staging
const inMemoryStore = new Map<string, number[]>();

export class RateLimiter {
  /**
   * Evaluates request rate for a given key (IP, User ID, or Resource ID)
   */
  static check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const timestamps = (inMemoryStore.get(key) || []).filter((t) => t > windowStart);

    if (timestamps.length >= config.limit) {
      const oldest = timestamps[0];
      const resetTimeMs = oldest + config.windowMs;

      return {
        success: false,
        limit: config.limit,
        remaining: 0,
        resetTimeMs,
      };
    }

    timestamps.push(now);
    inMemoryStore.set(key, timestamps);

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - timestamps.length,
      resetTimeMs: now + config.windowMs,
    };
  }

  /**
   * Standard helper to create 429 Too Many Requests response with RFC 6585 headers
   */
  static createTooManyRequestsResponse(result: RateLimitResult): NextResponse {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetTimeMs - Date.now()) / 1000));

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetTimeMs / 1000)),
        },
      }
    );
  }

  /**
   * Reset store (used for test isolation)
   */
  static resetStore() {
    inMemoryStore.clear();
  }
}

// Standard Default Configurations for Sensitive Endpoints
export const RATE_LIMIT_CONFIGS = {
  AUTH_LOGIN: { limit: 10, windowMs: 60 * 1000 }, // 10 attempts per minute per IP
  AUTH_REGISTER: { limit: 5, windowMs: 60 * 1000 }, // 5 registrations per minute per IP
  MESSAGING_SEND: { limit: 30, windowMs: 60 * 1000 }, // 30 messages per minute per user
  UPLOAD_PRESIGN: { limit: 20, windowMs: 60 * 1000 }, // 20 presigned uploads per minute per user
  COMMERCE_CHECKOUT: { limit: 10, windowMs: 60 * 1000 }, // 10 checkouts per minute per user
  ADMIN_ACTIONS: { limit: 60, windowMs: 60 * 1000 }, // 60 admin mutations per minute
};

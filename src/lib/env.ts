import { z } from "zod";

function sanitizeEnv(val: string | undefined): string | undefined {
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeAiWebhookUrl(val: string | undefined): string {
  const prodDefault = "https://ayan1.app.n8n.cloud/webhook/ecofarm-ai";
  if (!val || typeof val !== "string") return prodDefault;
  const trimmed = val.trim();
  if (!trimmed || trimmed.includes("localhost") || trimmed.includes("127.0.0.1")) {
    return prodDefault;
  }
  return trimmed;
}

const DEFAULT_AUTH_SECRET = "agri-aqua-network-phase-1-dev-secret-key-change-in-prod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .optional()
    .default("postgresql://postgres:postgres@localhost:5432/agri_aqua_db?schema=public"),
  AUTH_SECRET: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : DEFAULT_AUTH_SECRET)),
  NEXTAUTH_SECRET: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : DEFAULT_AUTH_SECRET)),
  APP_URL: z
    .string()
    .optional()
    .default("https://app.ayangiri.com"),
  NEXTAUTH_URL: z
    .string()
    .optional()
    .default("https://app.ayangiri.com"),
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  ECOFARM_AI_WEBHOOK_URL: z
    .string()
    .optional()
    .default("https://ayan1.app.n8n.cloud/webhook/ecofarm-ai"),
});

const rawAuthSecret =
  sanitizeEnv(process.env.AUTH_SECRET) ||
  sanitizeEnv(process.env.NEXTAUTH_SECRET) ||
  DEFAULT_AUTH_SECRET;

const rawAppUrl =
  sanitizeEnv(process.env.APP_URL) ||
  sanitizeEnv(process.env.NEXTAUTH_URL) ||
  "https://app.ayangiri.com";

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: sanitizeEnv(process.env.DATABASE_URL),
  AUTH_SECRET: rawAuthSecret,
  NEXTAUTH_SECRET: rawAuthSecret,
  APP_URL: rawAppUrl,
  NEXTAUTH_URL: rawAppUrl,
  OBJECT_STORAGE_ENDPOINT: sanitizeEnv(process.env.OBJECT_STORAGE_ENDPOINT),
  OBJECT_STORAGE_BUCKET: sanitizeEnv(process.env.OBJECT_STORAGE_BUCKET),
  RAZORPAY_KEY_ID: sanitizeEnv(process.env.RAZORPAY_KEY_ID) || sanitizeEnv(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: sanitizeEnv(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) || sanitizeEnv(process.env.RAZORPAY_KEY_ID),
  RAZORPAY_KEY_SECRET: sanitizeEnv(process.env.RAZORPAY_KEY_SECRET),
  RAZORPAY_WEBHOOK_SECRET: sanitizeEnv(process.env.RAZORPAY_WEBHOOK_SECRET),
  ECOFARM_AI_WEBHOOK_URL: sanitizeAiWebhookUrl(process.env.ECOFARM_AI_WEBHOOK_URL),
});

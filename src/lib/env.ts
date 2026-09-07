import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional().default("postgresql://postgres:postgres@localhost:5432/agri_aqua_db?schema=public"),
  AUTH_SECRET: z.string().min(1).default("agri-aqua-network-phase-1-dev-secret-key-change-in-prod"),
  NEXTAUTH_SECRET: z.string().min(1).default("agri-aqua-network-phase-1-dev-secret-key-change-in-prod"),
  APP_URL: z.string().optional().default("http://localhost:3000"),
  NEXTAUTH_URL: z.string().optional().default("http://localhost:3000"),
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  NEXTAUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  APP_URL: process.env.APP_URL || process.env.NEXTAUTH_URL,
  NEXTAUTH_URL: process.env.APP_URL || process.env.NEXTAUTH_URL,
  OBJECT_STORAGE_ENDPOINT: process.env.OBJECT_STORAGE_ENDPOINT,
  OBJECT_STORAGE_BUCKET: process.env.OBJECT_STORAGE_BUCKET,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
});

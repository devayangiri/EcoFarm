import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().default("postgresql://postgres:postgres@localhost:5432/agri_aqua_db?schema=public"),
  NEXTAUTH_SECRET: z.string().min(1).default("agri-aqua-network-phase-1-dev-secret-key-change-in-prod"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  OBJECT_STORAGE_ENDPOINT: process.env.OBJECT_STORAGE_ENDPOINT,
  OBJECT_STORAGE_BUCKET: process.env.OBJECT_STORAGE_BUCKET,
});

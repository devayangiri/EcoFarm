import { prisma } from "@/lib/prisma";

let syncPromise: Promise<any> | null = null;

export async function ensureDatabaseSchema(): Promise<{ success: boolean; error?: string }> {
  if (typeof (prisma as any)?.$executeRawUnsafe !== "function") {
    return { success: true };
  }
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      // 1. Ensure Enums
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "OtpDestinationType" AS ENUM ('EMAIL', 'MOBILE');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'PASSWORD_RESET');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // 2. Ensure User Table Columns
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);
      `);

      // 3. Ensure OTP Verifications Table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "otp_verifications" (
          "id" TEXT NOT NULL,
          "destinationType" "OtpDestinationType" NOT NULL,
          "destination" TEXT NOT NULL,
          "purpose" "OtpPurpose" NOT NULL,
          "otpHash" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "attempts" INTEGER NOT NULL DEFAULT 0,
          "maxAttempts" INTEGER NOT NULL DEFAULT 5,
          "verifiedAt" TIMESTAMP(3),
          "consumedAt" TIMESTAMP(3),
          "userId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
        );
      `);

      // 4. Ensure Indexes
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "otp_verifications_destination_purpose_idx" ON "otp_verifications"("destination", "purpose");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "otp_verifications_expiresAt_idx" ON "otp_verifications"("expiresAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "otp_verifications_createdAt_idx" ON "otp_verifications"("createdAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "otp_verifications_userId_idx" ON "otp_verifications"("userId");
      `);

      // 5. Ensure Foreign Key Constraint
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      return { success: true };
    } catch (err: any) {
      console.error("[ensureDatabaseSchema] Error syncing schema:", err);
      return { success: false, error: err?.message };
    }
  })();

  return syncPromise;
}

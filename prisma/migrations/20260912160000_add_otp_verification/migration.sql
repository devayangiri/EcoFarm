-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OtpDestinationType" AS ENUM ('EMAIL', 'MOBILE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'PASSWORD_RESET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable: otp_verifications
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "otp_verifications_destination_purpose_idx" ON "otp_verifications"("destination", "purpose");
CREATE INDEX IF NOT EXISTS "otp_verifications_expiresAt_idx" ON "otp_verifications"("expiresAt");
CREATE INDEX IF NOT EXISTS "otp_verifications_createdAt_idx" ON "otp_verifications"("createdAt");
CREATE INDEX IF NOT EXISTS "otp_verifications_userId_idx" ON "otp_verifications"("userId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

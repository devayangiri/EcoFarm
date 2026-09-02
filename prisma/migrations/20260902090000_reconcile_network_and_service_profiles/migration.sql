-- ====================================================
-- Migration: 20260902090000_reconcile_network_and_service_profiles
-- Reconciles production DDL with Prisma migration history
-- ====================================================


-- AlterTable: network_profiles
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "participantType" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "businessCategory" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "sector" "Sector" DEFAULT 'AGRICULTURE';
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: network_profiles
CREATE INDEX IF NOT EXISTS "network_profiles_participantType_idx" ON "network_profiles"("participantType");
CREATE INDEX IF NOT EXISTS "network_profiles_businessCategory_idx" ON "network_profiles"("businessCategory");
CREATE INDEX IF NOT EXISTS "network_profiles_sector_idx" ON "network_profiles"("sector");
CREATE INDEX IF NOT EXISTS "network_profiles_state_district_idx" ON "network_profiles"("state", "district");
CREATE INDEX IF NOT EXISTS "network_profiles_isVerified_idx" ON "network_profiles"("isVerified");


-- ====================================================
-- Migration: 20260902090000_reconcile_network_and_service_profiles
-- Reconciles production DDL with Prisma migration history
-- ====================================================


-- 2. Alter Table: network_profiles (add missing columns)
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "participantType" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "businessCategory" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "sector" "Sector" DEFAULT 'AGRICULTURE';
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- 3. Create Indexes: network_profiles
CREATE INDEX IF NOT EXISTS "network_profiles_participantType_idx" ON "network_profiles"("participantType");
CREATE INDEX IF NOT EXISTS "network_profiles_businessCategory_idx" ON "network_profiles"("businessCategory");
CREATE INDEX IF NOT EXISTS "network_profiles_sector_idx" ON "network_profiles"("sector");
CREATE INDEX IF NOT EXISTS "network_profiles_state_district_idx" ON "network_profiles"("state", "district");
CREATE INDEX IF NOT EXISTS "network_profiles_isVerified_idx" ON "network_profiles"("isVerified");

-- 4. Alter Table: service_listings
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "sector" "Sector" NOT NULL DEFAULT 'AGRICULTURE';
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "serviceArea" TEXT;
ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE';

-- 5. Create Indexes: service_listings
CREATE INDEX IF NOT EXISTS "service_listings_sector_idx" ON "service_listings"("sector");
CREATE INDEX IF NOT EXISTS "service_listings_status_idx" ON "service_listings"("status");

-- 6. Alter Table: provider_profiles
ALTER TABLE "provider_profiles" ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER DEFAULT 0;

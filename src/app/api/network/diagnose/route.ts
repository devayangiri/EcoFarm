import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const steps: Record<string, any> = {};

  try {
    steps.ping = await prisma.$queryRaw`SELECT 1 as ping`;
  } catch (e: any) {
    steps.ping = { error: e.message, code: e.code };
  }

  try {
    steps.columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'network_profiles'
    `;
  } catch (e: any) {
    steps.columns = { error: e.message, code: e.code };
  }

  try {
    steps.migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, rolled_back_at 
      FROM _prisma_migrations
    `;
  } catch (e: any) {
    steps.migrations = { error: e.message, code: e.code };
  }

  // Execute safe schema patch to add missing columns if they don't exist
  const ddlStatements = [
    'ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "participantType" TEXT',
    'ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "businessCategory" TEXT',
    'ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "sector" "Sector" DEFAULT \'AGRICULTURE\'',
    'ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "district" TEXT',
    'ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "state" TEXT',
    'ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT',
    'ALTER TABLE "network_profiles" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false',
    'CREATE INDEX IF NOT EXISTS "network_profiles_participantType_idx" ON "network_profiles"("participantType")',
    'CREATE INDEX IF NOT EXISTS "network_profiles_businessCategory_idx" ON "network_profiles"("businessCategory")',
    'CREATE INDEX IF NOT EXISTS "network_profiles_sector_idx" ON "network_profiles"("sector")',
    'CREATE INDEX IF NOT EXISTS "network_profiles_state_district_idx" ON "network_profiles"("state", "district")',
    'CREATE INDEX IF NOT EXISTS "network_profiles_isVerified_idx" ON "network_profiles"("isVerified")',
    'DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = \'ServiceStatus\') THEN CREATE TYPE "ServiceStatus" AS ENUM (\'ACTIVE\', \'PAUSED\', \'ARCHIVED\'); END IF; END $$',
    'ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "sector" "Sector" NOT NULL DEFAULT \'AGRICULTURE\'',
    'ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "serviceArea" TEXT',
    'ALTER TABLE "service_listings" ADD COLUMN IF NOT EXISTS "status" "ServiceStatus" NOT NULL DEFAULT \'ACTIVE\'',
    'ALTER TABLE "provider_profiles" ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER DEFAULT 0',
  ];

  steps.ddlResults = [];
  for (const stmt of ddlStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      steps.ddlResults.push({ stmt: stmt.slice(0, 50), status: "OK" });
    } catch (e: any) {
      steps.ddlResults.push({ stmt: stmt.slice(0, 50), error: e.message });
    }
  }

  try {
    steps.columnsAfterPatch = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'network_profiles'
    `;
  } catch (e: any) {
    steps.columnsAfterPatch = { error: e.message, code: e.code };
  }

  try {
    steps.findManyAfterPatch = await prisma.networkProfile.findMany({ take: 1 });
  } catch (e: any) {
    steps.findManyAfterPatch = { error: e.message, code: e.code, meta: e.meta };
  }

  return NextResponse.json({ success: true, steps });
}

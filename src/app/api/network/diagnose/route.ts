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

  try {
    steps.findMany = await prisma.networkProfile.findMany({ take: 1 });
  } catch (e: any) {
    steps.findMany = { error: e.message, code: e.code, meta: e.meta };
  }

  return NextResponse.json({ success: true, steps });
}

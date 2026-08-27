import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("?? Starting development seed for Agri-Aqua Network...");

  const defaultPasswordHash = await bcrypt.hash("Password123!", 12);
  const adminPasswordHash = await bcrypt.hash("AdminSecret2026!", 12);

  const seedUsers = [
    {
      fullName: "Ramesh Farmer",
      email: "farmer@agriaqua.dev",
      phone: "+919876543210",
      passwordHash: defaultPasswordHash,
      role: "FARMER" as const,
      status: "ACTIVE" as const,
    },
    {
      fullName: "Priya Wholesale Buyer",
      email: "buyer@agriaqua.dev",
      phone: "+919876543211",
      passwordHash: defaultPasswordHash,
      role: "BUYER" as const,
      status: "ACTIVE" as const,
    },
    {
      fullName: "Suresh Field Agent",
      email: "agent@agriaqua.dev",
      phone: "+919876543212",
      passwordHash: defaultPasswordHash,
      role: "AGENT" as const,
      status: "ACTIVE" as const,
    },
    {
      fullName: "Kiran Machinery & Logistics",
      email: "provider@agriaqua.dev",
      phone: "+919876543213",
      passwordHash: defaultPasswordHash,
      role: "SERVICE_PROVIDER" as const,
      status: "ACTIVE" as const,
    },
    {
      fullName: "Platform Super Administrator",
      email: "admin@agriaqua.dev",
      phone: "+919876543214",
      passwordHash: adminPasswordHash,
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
    },
    {
      fullName: "Suspended Test Account",
      email: "suspended@agriaqua.dev",
      phone: "+919876543215",
      passwordHash: defaultPasswordHash,
      role: "FARMER" as const,
      status: "SUSPENDED" as const,
    },
  ];

  for (const user of seedUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existing) {
      await prisma.user.create({
        data: user,
      });
      console.log(`  ? Created ${user.role} user: ${user.email}`);
    } else {
      console.log(`  - User ${user.email} already exists.`);
    }
  }

  console.log("? Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

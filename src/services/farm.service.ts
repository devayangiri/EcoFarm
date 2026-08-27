import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { Prisma, Sector } from "@prisma/client";
import type { CreateFarmInput, UpdateFarmInput } from "@/lib/validators/farm.schema";

export class FarmService {
  /**
   * Helper to verify farmer profile and get profile ID
   */
  private static async getFarmerProfileId(userId: string): Promise<string> {
    const profile = await prisma.farmerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Auto-create farmer profile if it does not exist yet
      const newProfile = await prisma.farmerProfile.create({
        data: { userId },
      });
      return newProfile.id;
    }

    return profile.id;
  }

  /**
   * List all farms owned by the farmer
   */
  static async getFarmerFarms(userId: string) {
    const farmerProfileId = await this.getFarmerProfileId(userId);

    return prisma.farm.findMany({
      where: { farmerProfileId },
      include: { address: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single farm by ID with ownership verification
   */
  static async getFarmById(userId: string, farmId: string) {
    const farmerProfileId = await this.getFarmerProfileId(userId);

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { address: true },
    });

    if (!farm) {
      throw AppError.notFound("Farm not found");
    }

    if (farm.farmerProfileId !== farmerProfileId) {
      throw AppError.forbidden("You do not have permission to view this farm");
    }

    return farm;
  }

  /**
   * Create a new farm record
   */
  static async createFarm(userId: string, input: CreateFarmInput) {
    const farmerProfileId = await this.getFarmerProfileId(userId);

    const farm = await prisma.$transaction(async (tx) => {
      // Create Address
      const address = await tx.address.create({
        data: {
          userId,
          villageOrStreet: input.villageOrStreet,
          cityOrTown: input.cityOrTown,
          district: input.district,
          state: input.state,
          pincode: input.pincode,
        },
      });

      // Create Farm
      const newFarm = await tx.farm.create({
        data: {
          farmerProfileId,
          name: input.name,
          sector: input.sector as Sector,
          totalAreaAcres: new Prisma.Decimal(input.totalAreaAcres),
          waterSourceType: input.waterSourceType,
          soilType: input.soilType,
          addressId: address.id,
        },
        include: { address: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "FARM_CREATED",
          resource: "Farm",
          resourceId: newFarm.id,
          metadata: { name: newFarm.name, sector: newFarm.sector },
        },
      });

      return newFarm;
    });

    return farm;
  }

  /**
   * Update an existing farm with ownership verification
   */
  static async updateFarm(
    userId: string,
    farmId: string,
    input: UpdateFarmInput
  ) {
    const farm = await this.getFarmById(userId, farmId);

    const updated = await prisma.$transaction(async (tx) => {
      // Update Address if address fields are provided
      if (
        farm.addressId &&
        (input.villageOrStreet ||
          input.cityOrTown ||
          input.district ||
          input.state ||
          input.pincode)
      ) {
        await tx.address.update({
          where: { id: farm.addressId },
          data: {
            villageOrStreet: input.villageOrStreet,
            cityOrTown: input.cityOrTown,
            district: input.district,
            state: input.state,
            pincode: input.pincode,
          },
        });
      }

      const res = await tx.farm.update({
        where: { id: farmId },
        data: {
          name: input.name,
          sector: input.sector ? (input.sector as Sector) : undefined,
          totalAreaAcres:
            input.totalAreaAcres !== undefined
              ? new Prisma.Decimal(input.totalAreaAcres)
              : undefined,
          waterSourceType: input.waterSourceType,
          soilType: input.soilType,
        },
        include: { address: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "FARM_UPDATED",
          resource: "Farm",
          resourceId: farmId,
          metadata: { changes: input },
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Delete a farm with ownership verification
   */
  static async deleteFarm(userId: string, farmId: string) {
    await this.getFarmById(userId, farmId);

    await prisma.$transaction(async (tx) => {
      await tx.farm.delete({ where: { id: farmId } });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "FARM_DELETED",
          resource: "Farm",
          resourceId: farmId,
        },
      });
    });

    return { success: true };
  }
}
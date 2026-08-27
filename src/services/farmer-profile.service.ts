import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { UpdateFarmerProfileInput } from "@/lib/validators/farmer-profile.schema";

export class FarmerProfileService {
  /**
   * Get farmer profile with user and address details
   */
  static async getFarmerProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        farmerProfile: {
          include: {
            address: true,
            farms: { include: { address: true } },
          },
        },
      },
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    if (!user.farmerProfile) {
      // Auto-create if not yet instantiated
      const newProfile = await prisma.farmerProfile.create({
        data: { userId },
        include: { address: true, farms: { include: { address: true } } },
      });
      return {
        ...user,
        farmerProfile: newProfile,
      };
    }

    return user;
  }

  /**
   * Update farmer profile details
   */
  static async updateFarmerProfile(
    userId: string,
    input: UpdateFarmerProfileInput
  ) {
    const current = await this.getFarmerProfile(userId);
    const profileId = current.farmerProfile!.id;
    const existingAddressId = current.farmerProfile?.addressId;

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update User basic information
      if (input.fullName || input.phone !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            fullName: input.fullName,
            phone: input.phone || undefined,
          },
        });
      }

      // 2. Handle Address update or creation
      let addressId = existingAddressId;
      if (
        input.villageOrStreet ||
        input.cityOrTown ||
        input.district ||
        input.state ||
        input.pincode
      ) {
        if (existingAddressId) {
          await tx.address.update({
            where: { id: existingAddressId },
            data: {
              villageOrStreet: input.villageOrStreet,
              cityOrTown: input.cityOrTown,
              district: input.district,
              state: input.state,
              pincode: input.pincode || undefined,
            },
          });
        } else if (
          input.villageOrStreet &&
          input.cityOrTown &&
          input.district &&
          input.state &&
          input.pincode
        ) {
          const newAddress = await tx.address.create({
            data: {
              userId,
              villageOrStreet: input.villageOrStreet,
              cityOrTown: input.cityOrTown,
              district: input.district,
              state: input.state,
              pincode: input.pincode,
            },
          });
          addressId = newAddress.id;
        }
      }

      // 3. Update FarmerProfile
      const profile = await tx.farmerProfile.update({
        where: { id: profileId },
        data: {
          experienceYears: input.experienceYears,
          avatarUrl: input.avatarUrl,
          addressId,
        },
        include: { address: true, farms: true },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "PROFILE_UPDATED",
          resource: "FarmerProfile",
          resourceId: profileId,
          metadata: { changes: input },
        },
      });

      return profile;
    });

    return updated;
  }
}
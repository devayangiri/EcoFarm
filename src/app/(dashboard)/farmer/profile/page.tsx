import React from "react";
import { requireRole } from "@/lib/rbac";
import { FarmerProfileService } from "@/services/farmer-profile.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForm } from "@/components/farmer/profile-form";

export const dynamic = "force-dynamic";

export default async function FarmerProfilePage() {
  const user = await requireRole("FARMER");
  const profileData = await FarmerProfileService.getFarmerProfile(user.userId);

  return (
    <AppShell showSidebar userRole="FARMER" userName={user.fullName} currentPath="/farmer/profile">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title="Farmer Profile & Settings"
          description="Update your contact information, farming experience, and operational headquarters."
          breadcrumbs={[
            { label: "Farmer Portal", href: "/farmer" },
            { label: "Profile", current: true },
          ]}
        />

        <ProfileForm user={profileData as any} />
      </div>
    </AppShell>
  );
}
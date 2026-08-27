import React from "react";
import { requireRole } from "@/lib/rbac";
import { BuyerService } from "@/services/buyer.service";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { BuyerProfileForm } from "@/components/buyer/buyer-profile-form";

export const dynamic = "force-dynamic";

export default async function BuyerProfilePage() {
  const user = await requireRole("BUYER");
  const profileData = await BuyerService.getBuyerProfile(user.userId);

  return (
    <AppShell showSidebar userRole="BUYER" userName={user.fullName} currentPath="/buyer/profile">
      <div className="p-4 sm:p-6 lg:p-8 max-w-stitch-container mx-auto space-y-6 font-body">
        <PageHeader
          title="Buyer Business Profile"
          description="Manage corporate entity information, tax registration numbers, and warehouse delivery locations."
          breadcrumbs={[
            { label: "Buyer Portal", href: "/buyer" },
            { label: "Profile", current: true },
          ]}
        />

        <BuyerProfileForm user={profileData as any} />
      </div>
    </AppShell>
  );
}
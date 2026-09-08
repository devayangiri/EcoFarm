import React from "react";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/rbac";
import { AIChatView } from "@/components/ai/ai-chat-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EcoFarm AI — Smart Agriculture & Business Assistant",
  description: "AI-powered assistance for agriculture, aquaculture, farm-gate trade, crop diagnosis, and bulk commodity procurement on EcoFarm.",
};

export default async function AIPage() {
  const session = await getCurrentUser();

  return (
    <AIChatView
      userRole={session?.role ?? null}
      userName={session?.fullName ?? null}
    />
  );
}

import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { CheckoutService } from "@/services/checkout.service";
import { prisma } from "@/lib/prisma";
import { MarketplaceShell } from "@/components/public/marketplace-shell";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const dynamic = "force-dynamic";

interface CheckoutPageProps {
  searchParams: { sessionId?: string };
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await getCurrentUser();
  if (!session || session.role !== "BUYER") {
    redirect("/login?callbackUrl=/checkout");
  }

  let sessionId = searchParams.sessionId;
  if (!sessionId) {
    try {
      const init = await CheckoutService.initiateCheckout(session.userId);
      sessionId = init.sessionId;
    } catch {
      redirect("/cart");
    }
  }

  let checkoutSession;
  try {
    checkoutSession = await CheckoutService.getCheckoutSession(session.userId, sessionId!);
  } catch {
    redirect("/cart");
  }

  const userAddress = await prisma.address.findFirst({
    where: { userId: session.userId },
  });

  return (
    <MarketplaceShell>
      <div className="py-6 max-w-stitch-container mx-auto space-y-6">
        <div className="space-y-1 text-left">
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">
            Secure Multi-Vendor Checkout
          </h1>
          <p className="text-xs text-slate-neutral">
            15-minute guaranteed inventory lock. Orders are placed directly with verified producers.
          </p>
        </div>

        <CheckoutFlow
          session={checkoutSession as any}
          defaultAddress={userAddress as any}
          buyerFullName={session.fullName}
          buyerPhone={session.phone}
        />
      </div>
    </MarketplaceShell>
  );
}
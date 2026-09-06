import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import { CartService } from "@/services/cart.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "BUYER") {
      return NextResponse.json({ success: true, count: 0 });
    }

    const count = await CartService.getCartItemCount(user.userId);
    return NextResponse.json({ success: true, count });
  } catch {
    return NextResponse.json({ success: true, count: 0 });
  }
}

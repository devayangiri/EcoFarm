import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceService } from "@/services/service.service";
import { AgentService } from "@/services/agent.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = url.searchParams.get("role") || "ALL";

  const diag: any = { role, timestamp: new Date().toISOString() };

  // Find latest SERVICE_PROVIDER user
  try {
    const provUser = await prisma.user.findFirst({
      where: { role: "SERVICE_PROVIDER" },
      orderBy: { createdAt: "desc" },
    });
    diag.provUser = provUser ? { id: provUser.id, email: provUser.email } : null;

    if (provUser) {
      try {
        const provDash = await ServiceService.getProviderDashboard(provUser.id);
        diag.provDash = { success: true, keys: Object.keys(provDash) };
      } catch (err: any) {
        diag.provDash = {
          success: false,
          error: err.message,
          stack: err.stack,
        };
      }
    }
  } catch (err: any) {
    diag.provUserError = err.message;
  }

  // Find latest AGENT user
  try {
    const agentUser = await prisma.user.findFirst({
      where: { role: "AGENT" },
      orderBy: { createdAt: "desc" },
    });
    diag.agentUser = agentUser ? { id: agentUser.id, email: agentUser.email } : null;

    if (agentUser) {
      try {
        const agentDash = await AgentService.getAgentDashboard(agentUser.id);
        diag.agentDash = { success: true, keys: Object.keys(agentDash) };
      } catch (err: any) {
        diag.agentDash = {
          success: false,
          error: err.message,
          stack: err.stack,
        };
      }
    }
  } catch (err: any) {
    diag.agentUserError = err.message;
  }

  return NextResponse.json(diag);
}

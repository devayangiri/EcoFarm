"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Users,
  Check,
  X,
  Trash2,
  Clock,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

export interface MyNetworkViewProps {
  initialNetwork: {
    connections: Array<{
      id: string;
      connectedUserId: string;
      displayName: string;
      headline?: string | null;
      participantType: string;
      businessCategory?: string | null;
      district?: string | null;
      state?: string | null;
      avatarUrl?: string | null;
      isVerified: boolean;
      establishedAt: string;
    }>;
    receivedRequests: Array<{
      id: string;
      senderId: string;
      displayName: string;
      headline?: string | null;
      participantType: string;
      message?: string | null;
      createdAt: string;
    }>;
    sentRequests: Array<{
      id: string;
      receiverId: string;
      displayName: string;
      headline?: string | null;
      participantType: string;
      message?: string | null;
      createdAt: string;
    }>;
    counts: {
      connectionsCount: number;
      receivedCount: number;
      sentCount: number;
    };
  };
}

export function MyNetworkView({ initialNetwork }: MyNetworkViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"connections" | "received" | "sent">("connections");
  const [network, setNetwork] = useState(initialNetwork);
  const [isLoading, setIsLoading] = useState(false);

  const handleAcceptRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/network/requests/${requestId}/accept`, { method: "PATCH" });
      if (res.ok) {
        router.refresh();
        const updatedRes = await fetch("/api/network/connections");
        const json = await updatedRes.json();
        if (json.success) setNetwork(json.data);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/network/requests/${requestId}/reject`, { method: "PATCH" });
      if (res.ok) {
        router.refresh();
        const updatedRes = await fetch("/api/network/connections");
        const json = await updatedRes.json();
        if (json.success) setNetwork(json.data);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/network/requests/${requestId}/cancel`, { method: "PATCH" });
      if (res.ok) {
        router.refresh();
        const updatedRes = await fetch("/api/network/connections");
        const json = await updatedRes.json();
        if (json.success) setNetwork(json.data);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveConnection = async (connId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/network/connections/${connId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
        const updatedRes = await fetch("/api/network/connections");
        const json = await updatedRes.json();
        if (json.success) setNetwork(json.data);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-dim pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("connections")}
          className={`px-4 py-2 rounded-md text-xs font-heading font-bold transition-all ${
            activeTab === "connections"
              ? "bg-brand-primary text-white"
              : "bg-surface-low text-slate-neutral hover:bg-surface-dim"
          }`}
        >
          My Connections ({network.counts.connectionsCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("received")}
          className={`px-4 py-2 rounded-md text-xs font-heading font-bold transition-all ${
            activeTab === "received"
              ? "bg-brand-primary text-white"
              : "bg-surface-low text-slate-neutral hover:bg-surface-dim"
          }`}
        >
          Received Requests ({network.counts.receivedCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-2 rounded-md text-xs font-heading font-bold transition-all ${
            activeTab === "sent"
              ? "bg-brand-primary text-white"
              : "bg-surface-low text-slate-neutral hover:bg-surface-dim"
          }`}
        >
          Sent Requests ({network.counts.sentCount})
        </button>
      </div>

      {/* Tab Content: Established Connections */}
      {activeTab === "connections" && (
        <div>
          {network.connections.length === 0 ? (
            <EmptyState
              title="No Business Connections Yet"
              description="Expand your agricultural supply chain network by connecting with verified farmers, mills, and buyers."
              actionLabel="Discover Directory"
              actionHref="/network"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {network.connections.map((conn) => (
                <Card key={conn.id} className="border border-surface-dim bg-white shadow-sm p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="primary" size="sm">{conn.participantType}</Badge>
                      <button
                        type="button"
                        onClick={() => handleRemoveConnection(conn.id)}
                        disabled={isLoading}
                        className="text-slate-neutral hover:text-status-error text-xs p-1"
                        title="Remove Connection"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <Link href={`/network/${conn.connectedUserId}`} className="block">
                      <h4 className="font-heading font-bold text-sm text-on-surface hover:text-brand-primary truncate">
                        {conn.displayName}
                      </h4>
                    </Link>

                    <p className="text-xs text-slate-neutral line-clamp-1">
                      {(conn.headline || conn.businessCategory || "Active EcoFarm Member")
                        .replace(/Member at Agri-Aqua Network/gi, "on EcoFarm")
                        .replace(/Agri-Aqua Network/gi, "EcoFarm")}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-surface-dim flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-neutral">Connected {new Date(conn.establishedAt).toLocaleDateString()}</span>
                    <Link href={`/network/${conn.connectedUserId}`}>
                      <Button variant="outline" size="sm">View Profile</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Received Requests */}
      {activeTab === "received" && (
        <div className="space-y-4">
          {network.receivedRequests.length === 0 ? (
            <EmptyState
              title="No Incoming Connection Requests"
              description="When other producers or commercial buyers request to connect with your business entity, they will appear here."
            />
          ) : (
            <div className="space-y-3">
              {network.receivedRequests.map((req) => (
                <Card key={req.id} className="border border-surface-dim bg-white shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/network/${req.senderId}`}>
                        <h4 className="font-heading font-bold text-sm text-on-surface hover:text-brand-primary">
                          {req.displayName}
                        </h4>
                      </Link>
                      <Badge variant="secondary" size="sm">{req.participantType}</Badge>
                    </div>
                    {req.message && <p className="text-xs text-slate-neutral">&ldquo;{req.message}&rdquo;</p>}
                    <span className="text-[11px] text-slate-neutral block">Requested {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptRequest(req.id)}
                      isLoading={isLoading}
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectRequest(req.id)}
                      isLoading={isLoading}
                      leftIcon={<X className="h-3.5 w-3.5" />}
                    >
                      Decline
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Sent Requests */}
      {activeTab === "sent" && (
        <div className="space-y-4">
          {network.sentRequests.length === 0 ? (
            <EmptyState
              title="No Pending Outgoing Requests"
              description="Explore the B2B directory to reach out to agricultural suppliers and buyers."
              actionLabel="Discover Directory"
              actionHref="/network"
            />
          ) : (
            <div className="space-y-3">
              {network.sentRequests.map((req) => (
                <Card key={req.id} className="border border-surface-dim bg-white shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/network/${req.receiverId}`}>
                        <h4 className="font-heading font-bold text-sm text-on-surface hover:text-brand-primary">
                          {req.displayName}
                        </h4>
                      </Link>
                      <Badge variant="outline" size="sm">{req.participantType}</Badge>
                    </div>
                    <span className="text-[11px] text-slate-neutral block">Sent on {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelRequest(req.id)}
                    isLoading={isLoading}
                    leftIcon={<X className="h-3.5 w-3.5" />}
                  >
                    Cancel Request
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

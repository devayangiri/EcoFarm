"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { NotificationChannel, NotificationType } from "@prisma/client";
import { ArrowLeft, Save, ShieldCheck, Mail, MessageSquare, Phone } from "lucide-react";

export interface PreferenceItem {
  channel: NotificationChannel;
  type: NotificationType;
  isEnabled: boolean;
}

export interface NotificationPreferencesViewProps {
  initialPreferences: PreferenceItem[];
  currentUserId: string;
}

const CATEGORY_DEFINITIONS: Array<{
  type: NotificationType;
  title: string;
  description: string;
}> = [
  {
    type: "ORDER_UPDATE",
    title: "Orders & Shipments",
    description: "Order confirmations, status changes, tracking updates, and cancellations.",
  },
  {
    type: "PAYMENT_UPDATE",
    title: "Payments & Invoices",
    description: "Payment receipts, payouts, transaction confirmations, and refund notices.",
  },
  {
    type: "MESSAGE",
    title: "Direct & Contextual Messages",
    description: "New buyer-seller chat messages and context inquiry updates.",
  },
  {
    type: "CONNECTION_REQUEST",
    title: "B2B Business Network",
    description: "Connection invitations, acceptances, and B2B directory inquiries.",
  },
  {
    type: "SERVICE_UPDATE",
    title: "Services & Quotations",
    description: "Service requests, quotation submissions, acceptance, and job completions.",
  },
  {
    type: "AGENT_UPDATE",
    title: "Agent Operations & Tasks",
    description: "Lead assignments, assigned field tasks, and operational CRM events.",
  },
  {
    type: "VERIFICATION_UPDATE",
    title: "Trust & Verification",
    description: "Business badge verification approvals, requests for documents, and status reviews.",
  },
  {
    type: "PRODUCT_MODERATION",
    title: "Marketplace Listings",
    description: "Product moderation decisions, catalog approvals, and inventory alerts.",
  },
  {
    type: "SYSTEM",
    title: "System & Security",
    description: "Critical security notices, platform policy updates, and maintenance announcements.",
  },
];

export function NotificationPreferencesView({
  initialPreferences,
}: NotificationPreferencesViewProps) {
  const [preferences, setPreferences] = useState<PreferenceItem[]>(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getPreferenceState = (channel: NotificationChannel, type: NotificationType): boolean => {
    const item = preferences.find((p) => p.channel === channel && p.type === type);
    return item ? item.isEnabled : false;
  };

  const handleToggle = (channel: NotificationChannel, type: NotificationType) => {
    setPreferences((prev) =>
      prev.map((p) => {
        if (p.channel === channel && p.type === type) {
          return { ...p, isEnabled: !p.isEnabled };
        }
        return p;
      })
    );
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save preferences");
      }

      setPreferences(json.data);
      setSuccessMessage("Notification preferences saved successfully.");
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
        <div className="space-y-1">
          <Link href="/notifications" className="inline-flex items-center gap-1.5 text-xs text-brand-primary font-semibold hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Notification Hub</span>
          </Link>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
            Notification Preferences
          </h1>
          <p className="text-xs text-slate-neutral">
            Choose how and where you receive updates across platform events and channels.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          isLoading={isSaving}
          className="text-xs gap-1.5 shrink-0"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save Preferences</span>
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Channel Information Banner */}
      <Card className="p-4 bg-surface-low border border-surface-dim shadow-xs space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-status-success shrink-0" />
          <strong className="font-heading font-bold text-sm text-on-surface">
            Multi-Channel Delivery Protocol
          </strong>
        </div>
        <p className="text-slate-neutral leading-relaxed">
          <strong>In-App</strong> delivery is active with live real-time Server-Sent Events (SSE). <strong>Email</strong> notifications are routed for high-priority transaction events. <strong>SMS</strong> and <strong>WhatsApp</strong> adapters are maintained for future expansion and remain off by default.
        </p>
      </Card>

      {/* Preferences Matrix */}
      <div className="space-y-4">
        {CATEGORY_DEFINITIONS.map((cat) => (
          <Card key={cat.type} className="p-4 bg-white border border-surface-dim shadow-xs space-y-3">
            <div className="space-y-0.5">
              <strong className="font-heading font-bold text-sm text-on-surface block">
                {cat.title}
              </strong>
              <p className="text-xs text-slate-neutral">
                {cat.description}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-surface-dim">
              {/* In-App */}
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-surface-low border border-surface-dim cursor-pointer text-xs">
                <span className="font-semibold text-on-surface">In-App</span>
                <input
                  type="checkbox"
                  checked={getPreferenceState("IN_APP", cat.type)}
                  onChange={() => handleToggle("IN_APP", cat.type)}
                  className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
                />
              </label>

              {/* Email */}
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-surface-low border border-surface-dim cursor-pointer text-xs">
                <span className="font-semibold text-on-surface">Email</span>
                <input
                  type="checkbox"
                  checked={getPreferenceState("EMAIL", cat.type)}
                  onChange={() => handleToggle("EMAIL", cat.type)}
                  className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
                />
              </label>

              {/* SMS */}
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-surface-low border border-surface-dim cursor-pointer text-xs opacity-70">
                <span className="font-semibold text-slate-neutral">SMS</span>
                <input
                  type="checkbox"
                  checked={getPreferenceState("SMS", cat.type)}
                  onChange={() => handleToggle("SMS", cat.type)}
                  className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
                />
              </label>

              {/* WhatsApp */}
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-surface-low border border-surface-dim cursor-pointer text-xs opacity-70">
                <span className="font-semibold text-slate-neutral">WhatsApp</span>
                <input
                  type="checkbox"
                  checked={getPreferenceState("WHATSAPP", cat.type)}
                  onChange={() => handleToggle("WHATSAPP", cat.type)}
                  className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"
                />
              </label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

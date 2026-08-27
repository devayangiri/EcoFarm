"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Settings, ShieldCheck } from "lucide-react";

export interface AdminSettingItem {
  id: string;
  key: string;
  value: any;
  category: string;
  description?: string | null;
}

export function AdminSettingsView({ initialSettings }: { initialSettings: AdminSettingItem[] }) {
  const [settings, setSettings] = useState<AdminSettingItem[]>(initialSettings);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSave = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      let parsedValue: any;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = { value: newValue };
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey, value: parsedValue, description: newDesc }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update platform setting");

      setFeedback({ type: "success", message: `Setting "${newKey}" updated successfully.` });
      setNewKey("");
      setNewValue("");
      setNewDesc("");
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="border-b border-surface-dim pb-4 space-y-1">
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
          Platform Configuration Settings
        </h1>
        <p className="text-xs text-slate-neutral">
          Manage system-level defaults and flags. Secrets and credentials are strictly rejected.
        </p>
      </div>

      {feedback && <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>{feedback.message}</Alert>}

      <Card className="p-4 bg-white border border-surface-dim shadow-xs space-y-4 max-w-xl">
        <strong className="font-heading font-bold text-sm text-on-surface block">
          Update / Create Public Setting
        </strong>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-on-surface block mb-1">Setting Key</label>
            <Input
              placeholder="e.g. PLATFORM_MAINTENANCE_MODE or SUPPORT_PHONE"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="text-xs h-9 bg-surface-low"
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">Value (JSON or String)</label>
            <Input
              placeholder='e.g. {"enabled": false} or "support@agriaqua.com"'
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="text-xs h-9 bg-surface-low"
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">Description</label>
            <Input
              placeholder="Brief context for administrative reference..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="text-xs h-9 bg-surface-low"
            />
          </div>

          <Button variant="primary" size="sm" onClick={handleSave} disabled={isSubmitting || !newKey.trim()} isLoading={isSubmitting}>
            Save Setting
          </Button>
        </div>
      </Card>
    </div>
  );
}

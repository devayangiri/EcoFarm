"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { Plus, ArrowRight, Phone, Mail, Clock, MessageSquare, Send } from "lucide-react";

export interface LeadPipelineBoardProps {
  leads: Array<{
    id: string;
    contactName: string;
    contactPhone?: string | null;
    contactEmail?: string | null;
    source?: string | null;
    targetSector: string;
    stage: string;
    estimatedValue?: number | null;
    notes?: string | null;
    lastActivity?: any;
    updatedAt: string;
  }>;
}

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "CONVERTED", "LOST"] as const;

export function LeadPipelineBoard({ leads }: LeadPipelineBoardProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<string>("NEW");

  // Create Lead Form
  const [newLeadData, setNewLeadData] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    source: "FIELD_OUTREACH",
    targetSector: "AGRICULTURE",
    stage: "NEW",
    estimatedValue: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/agent/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLeadData,
          estimatedValue: newLeadData.estimatedValue ? Number(newLeadData.estimatedValue) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to create lead");

      setIsCreateModalOpen(false);
      setNewLeadData({
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        source: "FIELD_OUTREACH",
        targetSector: "AGRICULTURE",
        stage: "NEW",
        estimatedValue: "",
        notes: "",
      });
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageTransition = async (leadId: string, nextStage: string) => {
    try {
      const res = await fetch(`/api/agent/leads/${leadId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update stage");

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-on-surface">Lead CRM Pipeline</h1>
          <p className="text-xs text-slate-neutral">
            Track farmer & buyer prospect acquisition across stages from outreach to conversion.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Lead
        </Button>
      </div>

      {/* Desktop Kanban Board (Hidden on small screens) */}
      <div className="hidden lg:grid grid-cols-6 gap-3 items-start">
        {STAGES.map((stg) => {
          const stageLeads = leads.filter((l) => l.stage === stg);
          return (
            <div key={stg} className="bg-surface-low rounded-lg p-3 border border-surface-dim space-y-3 min-h-[450px]">
              <div className="flex items-center justify-between border-b border-surface-dim pb-2">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-on-surface">
                  {stg}
                </span>
                <span className="h-5 w-5 rounded-full bg-white text-[11px] font-mono font-bold flex items-center justify-center border border-surface-dim">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {stageLeads.map((l) => (
                  <Card key={l.id} className="p-3 bg-white border border-surface-dim shadow-xs space-y-2">
                    <strong className="font-heading font-bold text-xs text-on-surface block truncate">
                      {l.contactName}
                    </strong>
                    {l.contactPhone && (
                      <span className="text-[11px] text-slate-neutral flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {l.contactPhone}
                      </span>
                    )}
                    {l.estimatedValue && (
                      <span className="font-mono text-xs font-bold text-brand-primary block">
                        {formatCurrency(l.estimatedValue)}
                      </span>
                    )}

                    {/* Stage quick action */}
                    {stg !== "CONVERTED" && stg !== "LOST" && (
                      <div className="pt-2 border-t border-surface-dim flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2 text-brand-primary"
                          onClick={() => {
                            const nextIdx = STAGES.indexOf(stg) + 1;
                            if (nextIdx < STAGES.length) handleStageTransition(l.id, STAGES[nextIdx]);
                          }}
                        >
                          Advance →
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Stage Tabs Layout */}
      <div className="lg:hidden space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STAGES.map((stg) => (
            <Button
              key={stg}
              variant={activeTab === stg ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab(stg)}
              className="text-xs whitespace-nowrap"
            >
              {stg} ({leads.filter((l) => l.stage === stg).length})
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {leads
            .filter((l) => l.stage === activeTab)
            .map((l) => (
              <Card key={l.id} className="p-4 bg-white border border-surface-dim shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="font-heading font-bold text-sm text-on-surface">{l.contactName}</strong>
                  <Badge variant="primary" size="sm">{l.targetSector}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-neutral">
                  {l.contactPhone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{l.contactPhone}</span>}
                  {l.estimatedValue && <span className="font-mono font-bold text-brand-primary">{formatCurrency(l.estimatedValue)}</span>}
                </div>
              </Card>
            ))}
        </div>
      </div>

      {/* Create Lead Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New CRM Lead"
        description="Record a new field prospect, farmer cooperative, or wholesale buyer lead."
        maxWidth="md"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 font-body text-left">
          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <FormField label="Contact Person / Organization Name" required>
            <Input
              value={newLeadData.contactName}
              onChange={(e) => setNewLeadData({ ...newLeadData, contactName: e.target.value })}
              placeholder="e.g. Swadhin Ghosh / Ghosh Cold Agrotech"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Phone Number">
              <Input
                value={newLeadData.contactPhone}
                onChange={(e) => setNewLeadData({ ...newLeadData, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </FormField>

            <FormField label="Email Address">
              <Input
                type="email"
                value={newLeadData.contactEmail}
                onChange={(e) => setNewLeadData({ ...newLeadData, contactEmail: e.target.value })}
                placeholder="contact@example.com"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Target Sector">
              <Select
                value={newLeadData.targetSector}
                onChange={(e) => setNewLeadData({ ...newLeadData, targetSector: e.target.value })}
                options={[
                  { label: "Agriculture", value: "AGRICULTURE" },
                  { label: "Aquaculture", value: "AQUACULTURE" },
                ]}
              />
            </FormField>

            <FormField label="Estimated Commercial Value (₹ INR)">
              <Input
                type="number"
                value={newLeadData.estimatedValue}
                onChange={(e) => setNewLeadData({ ...newLeadData, estimatedValue: e.target.value })}
                placeholder="e.g. 250000"
              />
            </FormField>
          </div>

          <FormField label="Notes & Context">
            <Textarea
              rows={3}
              value={newLeadData.notes}
              onChange={(e) => setNewLeadData({ ...newLeadData, notes: e.target.value })}
              placeholder="Prospect requirements, acre volume, or preferred contact timeline..."
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
              Save Lead
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

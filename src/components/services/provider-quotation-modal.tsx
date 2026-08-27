"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Send } from "lucide-react";

export interface ProviderQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceRequestId: string;
  requestNumber: string;
  requesterName: string;
  onSuccess?: () => void;
}

export function ProviderQuotationModal({
  isOpen,
  onClose,
  serviceRequestId,
  requestNumber,
  requesterName,
  onSuccess,
}: ProviderQuotationModalProps) {
  const [amount, setAmount] = useState("");
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10)
  );
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/services/requests/${serviceRequestId}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          validUntil: new Date(validUntil).toISOString(),
          terms: terms || null,
          notes: notes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to submit quotation");
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Formal Service Quotation"
      description={`Provide binding commercial quotation for Request ${requestNumber} (Client: ${requesterName}).`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-body text-left">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Total Quotation Amount (₹ INR)" required hint="All-inclusive service amount">
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 45000"
              required
            />
          </FormField>

          <FormField label="Quote Validity Until" required>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              required
            />
          </FormField>
        </div>

        <FormField label="Terms & Conditions" hint="e.g. 50% on mobilization, diesel inclusive, weather delay policies">
          <Textarea
            rows={3}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Specify service deliverables, fuel responsibility, and working hour limits..."
          />
        </FormField>

        <FormField label="Notes for Client">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Operational comments e.g. Operator team will arrive on site at 06:00 AM..."
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isLoading}
            rightIcon={<Send className="h-4 w-4" />}
          >
            Submit Quotation
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

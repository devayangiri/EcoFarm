"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Send } from "lucide-react";

export interface NetworkEnquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
  targetHeadline?: string | null;
}

export function NetworkEnquiryDialog({
  isOpen,
  onClose,
  targetUserId,
  targetName,
  targetHeadline,
}: NetworkEnquiryDialogProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 10) {
      setErrorMessage("Enquiry message must contain at least 10 characters.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/network/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          content,
          contextSnapshot: {
            targetName,
            targetHeadline,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to transmit enquiry");
      }

      setSuccessMessage("Your commercial enquiry has been successfully delivered!");
      setTimeout(() => {
        setContent("");
        setSuccessMessage(null);
        onClose();
      }, 1500);
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
      title="Send Commercial Enquiry"
      description={`Direct enquiry to ${targetName}.`}
      maxWidth="md"
    >
      {successMessage ? (
        <Alert variant="success">
          {successMessage}
        </Alert>
      ) : (
        <form onSubmit={handleSend} className="space-y-4 font-body text-left">
          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <div className="p-3 bg-surface-low rounded border border-surface-dim text-xs">
            <span className="text-slate-neutral block">Recipient Entity:</span>
            <strong className="text-on-surface font-semibold">{targetName}</strong>
            {targetHeadline && <p className="text-slate-neutral mt-0.5">{targetHeadline}</p>}
          </div>

          <FormField
            label="Enquiry Proposal & Requirements"
            required
            hint="Describe your supply capacity, volume procurement requirement, or service inquiry."
          >
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. We are interested in contracting 20 Metric Tonnes of Swarna paddy for our processing mill in November. Please share your delivery capacity..."
              rows={4}
              required
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
            <Button variant="outline" size="sm" onClick={onClose} type="button" disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isLoading}
              rightIcon={<Send className="h-4 w-4" />}
            >
              Transmit Enquiry
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { MessageSquare, Send } from "lucide-react";

export interface InquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  sellerName: string;
}

export function InquiryDialog({
  isOpen,
  onClose,
  productId,
  productTitle,
  sellerName,
}: InquiryDialogProps) {
  const [message, setMessage] = useState(
    `Hello ${sellerName}, I am interested in sourcing "${productTitle}". Could you please provide details regarding lot availability, harvest certification, and bulk dispatch schedules?`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setErrorMessage("Please enter an inquiry message of at least 5 characters");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/inquiries/product/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to send inquiry");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
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
      title="Inquire About Commodity"
      description={`Direct inquiry to producer ${sellerName} regarding "${productTitle}".`}
      maxWidth="md"
    >
      {success ? (
        <Alert variant="success">
          Your inquiry has been sent to the producer. They will be notified immediately.
        </Alert>
      ) : (
        <form onSubmit={handleSend} className="space-y-4 font-body text-left">
          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <FormField label="Inquiry Message" required hint="State your required volume, expected delivery date, and quality specifications.">
            <Textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message to the seller..."
              required
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-dim">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isLoading}
              rightIcon={<Send className="h-3.5 w-3.5" />}
            >
              Send Inquiry
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
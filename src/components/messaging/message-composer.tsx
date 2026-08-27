"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Paperclip, Send, X, FileText, Image as ImageIcon } from "lucide-react";

export interface AttachmentUploadItem {
  storageKey: string;
  originalFileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  fileSizeBytes: number;
}

export interface MessageComposerProps {
  onSendMessage: (content: string, attachments?: AttachmentUploadItem[]) => Promise<void>;
  disabled?: boolean;
}

export function MessageComposer({ onSendMessage, disabled }: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<AttachmentUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      setErrorMessage("Maximum 5 attachments allowed per message.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const newItems: AttachmentUploadItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Unsupported file type for "${file.name}". Allowed: JPG, PNG, WEBP, PDF.`);
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds maximum allowed size of 10MB.`);
        }

        // Get presigned upload metadata from API
        const presignRes = await fetch("/api/messages/attachments/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            fileSizeBytes: file.size,
          }),
        });
        const presignJson = await presignRes.json();
        if (!presignRes.ok || !presignJson.success) {
          throw new Error(presignJson.message || "Failed to prepare file upload");
        }

        newItems.push({
          storageKey: presignJson.data.storageKey,
          originalFileName: file.name,
          mimeType: file.type as any,
          fileSizeBytes: file.size,
        });
      }

      setAttachments((prev) => [...prev, ...newItems]);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;
    if (trimmed.length > 2000) {
      setErrorMessage("Message cannot exceed 2000 characters.");
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      await onSendMessage(trimmed, attachments.length > 0 ? attachments : undefined);
      setContent("");
      setAttachments([]);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-surface-dim bg-white p-3 space-y-2 font-body text-left">
      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Attachment Preview Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-1">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-low border border-surface-dim text-xs"
            >
              {att.mimeType.startsWith("image/") ? (
                <ImageIcon className="h-3.5 w-3.5 text-brand-primary" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-status-warning" />
              )}
              <span className="max-w-[150px] truncate">{att.originalFileName}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="text-slate-neutral hover:text-status-error ml-1"
                aria-label="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || isSending}
          className="h-10 px-3 shrink-0"
          aria-label="Add attachments"
        >
          <Paperclip className="h-4 w-4 text-slate-neutral" />
        </Button>

        <div className="flex-1 relative">
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message (Enter to send, Shift+Enter for new line)..."
            disabled={disabled || isSending}
            className="w-full resize-none rounded-lg border border-surface-dim bg-surface-low px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white text-on-surface"
          />
          <span className="absolute right-2 bottom-2 text-[10px] text-slate-neutral pointer-events-none">
            {content.length}/2000
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={disabled || isSending || (!content.trim() && attachments.length === 0)}
          isLoading={isSending}
          className="h-10 px-4 shrink-0"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { MessageComposer, AttachmentUploadItem } from "@/components/messaging/message-composer";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { FileText, Image as ImageIcon, Trash2, CheckCheck } from "lucide-react";

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  isDeleted: boolean;
  contextType?: string | null;
  contextId?: string | null;
  contextSnapshot?: any;
  isOwn: boolean;
  attachments: Array<{
    id: string;
    storageKey: string;
    originalFileName: string;
    mimeType: string;
    fileSizeBytes: number;
  }>;
  createdAt: string;
}

export interface ChatViewProps {
  conversation: {
    id: string;
    title: string;
    contextType?: "GENERAL" | "PRODUCT" | "ORDER" | "SERVICE" | "BUSINESS" | null;
    contextSnapshot?: any;
    otherUser?: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    } | null;
  };
  messages: MessageItem[];
  onSendMessage: (content: string, attachments?: AttachmentUploadItem[]) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onBackMobile?: () => void;
}

export function ChatView({
  conversation,
  messages,
  onSendMessage,
  onDeleteMessage,
  onBackMobile,
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-surface-low font-body text-left">
      {/* Header */}
      <div className="p-3 bg-white border-b border-surface-dim flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBackMobile && (
            <button
              type="button"
              onClick={onBackMobile}
              className="lg:hidden text-xs font-semibold text-brand-primary"
            >
              ← Back
            </button>
          )}

          <div className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary font-heading font-bold text-xs flex items-center justify-center shrink-0">
            {conversation.otherUser?.fullName
              ? conversation.otherUser.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
              : "AA"}
          </div>

          <div className="min-w-0">
            <strong className="font-heading font-bold text-sm text-on-surface block truncate">
              {conversation.otherUser?.fullName || conversation.title}
            </strong>
            <span className="text-[11px] text-slate-neutral">
              {conversation.otherUser?.role || "Participant"}
            </span>
          </div>
        </div>

        {conversation.contextType && conversation.contextType !== "GENERAL" && (
          <Badge variant="primary" size="sm">
            {conversation.contextType}
          </Badge>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-neutral">
            No messages yet. Send a message to start the conversation.
          </div>
        ) : (
          messages.map((m) => {
            const isOwn = m.isOwn;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-xl p-3 text-xs shadow-xs space-y-1.5 ${
                    isOwn
                      ? "bg-brand-primary text-white rounded-br-none"
                      : "bg-white text-on-surface border border-surface-dim rounded-bl-none"
                  }`}
                >
                  {/* Sender Name for incoming */}
                  {!isOwn && (
                    <span className="font-heading font-semibold text-[11px] text-brand-primary block">
                      {m.senderName}
                    </span>
                  )}

                  {/* Message Content */}
                  <p
                    className={`leading-relaxed whitespace-pre-wrap ${
                      m.isDeleted ? "italic opacity-60" : ""
                    }`}
                  >
                    {m.content}
                  </p>

                  {/* Attachments */}
                  {!m.isDeleted && m.attachments && m.attachments.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {m.attachments.map((att) => (
                        <div
                          key={att.id}
                          className={`p-2 rounded flex items-center gap-2 text-[11px] ${
                            isOwn ? "bg-white/10 text-white" : "bg-surface-low text-on-surface"
                          }`}
                        >
                          {att.mimeType.startsWith("image/") ? (
                            <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate flex-1">{att.originalFileName}</span>
                          <span className="text-[10px] opacity-75">
                            {Math.round(att.fileSizeBytes / 1024)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer (Timestamp & Status) */}
                  <div
                    className={`flex items-center justify-end gap-1.5 text-[10px] pt-0.5 ${
                      isOwn ? "text-white/70" : "text-slate-neutral"
                    }`}
                  >
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isOwn && <CheckCheck className="h-3 w-3" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <MessageComposer onSendMessage={onSendMessage} />
    </div>
  );
}

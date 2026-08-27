"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils";
import { Search, ShoppingBag, Package, Wrench, Building2, MessageSquare, Paperclip } from "lucide-react";

export interface ConversationListItem {
  id: string;
  title: string;
  isGroup: boolean;
  contextType?: "GENERAL" | "PRODUCT" | "ORDER" | "SERVICE" | "BUSINESS" | null;
  contextId?: string | null;
  contextSnapshot?: any;
  otherUser?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  lastMessage?: {
    id: string;
    content: string;
    isDeleted: boolean;
    createdAt: string;
    senderId: string;
    hasAttachments: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationListProps {
  conversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const term = search.toLowerCase();
    const nameMatch = c.otherUser?.fullName.toLowerCase().includes(term);
    const titleMatch = c.title?.toLowerCase().includes(term);
    const msgMatch = c.lastMessage?.content.toLowerCase().includes(term);
    return nameMatch || titleMatch || msgMatch;
  });

  const getContextIcon = (type?: string | null) => {
    switch (type) {
      case "PRODUCT":
        return <ShoppingBag className="h-3 w-3 text-brand-primary" />;
      case "ORDER":
        return <Package className="h-3 w-3 text-status-warning" />;
      case "SERVICE":
        return <Wrench className="h-3 w-3 text-accent-aqua" />;
      case "BUSINESS":
        return <Building2 className="h-3 w-3 text-status-info" />;
      default:
        return <MessageSquare className="h-3 w-3 text-slate-neutral" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-surface-dim font-body">
      {/* Search Header */}
      <div className="p-3 border-b border-surface-dim">
        <div className="relative">
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9 bg-surface-low"
          />
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-neutral" />
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-surface-dim">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-neutral">
            No conversations found.
          </div>
        ) : (
          filtered.map((c) => {
            const isSelected = c.id === selectedId;
            const initials = c.otherUser?.fullName
              ? c.otherUser.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
              : "AA";

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                  isSelected
                    ? "bg-brand-primary/10 border-l-4 border-brand-primary"
                    : "hover:bg-surface-low"
                }`}
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-surface-dim text-on-surface font-heading font-bold text-xs flex items-center justify-center shrink-0">
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <strong className="font-heading font-bold text-xs text-on-surface truncate block">
                      {c.otherUser?.fullName || c.title}
                    </strong>
                    <span className="text-[10px] text-slate-neutral shrink-0">
                      {c.lastMessage ? formatRelativeTime(new Date(c.lastMessage.createdAt)) : ""}
                    </span>
                  </div>

                  {/* Context Badge & Sub-title */}
                  <div className="flex items-center gap-1.5">
                    {c.contextType && c.contextType !== "GENERAL" && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-surface-low text-slate-neutral font-medium">
                        {getContextIcon(c.contextType)}
                        <span>{c.contextType}</span>
                      </span>
                    )}
                    {c.otherUser?.role && (
                      <span className="text-[10px] text-slate-neutral">
                        • {c.otherUser.role}
                      </span>
                    )}
                  </div>

                  {/* Last Message Preview & Unread Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-neutral truncate flex items-center gap-1">
                      {c.lastMessage?.hasAttachments && (
                        <Paperclip className="h-3 w-3 shrink-0" />
                      )}
                      <span>{c.lastMessage?.content || "No messages yet"}</span>
                    </p>

                    {c.unreadCount > 0 && (
                      <span className="h-4 min-w-[16px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

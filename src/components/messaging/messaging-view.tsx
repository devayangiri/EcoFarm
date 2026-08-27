"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConversationList, ConversationListItem } from "./conversation-list";
import { ChatView, MessageItem } from "./chat-view";
import { ContextDetailsPanel } from "./context-details-panel";
import { AttachmentUploadItem } from "./message-composer";
import { EmptyState } from "@/components/ui/empty-state";

export interface MessagingViewProps {
  initialConversations: ConversationListItem[];
  initialActiveId?: string | null;
  currentUserId: string;
}

export function MessagingView({
  initialConversations,
  initialActiveId,
  currentUserId,
}: MessagingViewProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialActiveId || (initialConversations[0]?.id ?? null)
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Fetch messages when active conversation changes
  const fetchMessages = useCallback(async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/conversations/${convId}/messages?limit=100`);
      const json = await res.json();
      if (res.ok && json.success) {
        setMessages(json.data);
      }

      // Mark conversation as read
      await fetch(`/api/messages/conversations/${convId}/read`, { method: "POST" });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      // Ignored
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
    }
  }, [activeId, fetchMessages]);

  // Connect to SSE for realtime downlink
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/messages/events");

      eventSource.addEventListener("MESSAGE_CREATED", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          // If message is for currently active conversation, append to chat feed
          if (activeId && payload.conversationId === activeId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.id)) return prev;
              return [
                ...prev,
                {
                  ...payload,
                  isOwn: payload.senderId === currentUserId,
                },
              ];
            });
          }

          // Update conversation list preview & unread count
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === payload.conversationId) {
                return {
                  ...c,
                  lastMessage: {
                    id: payload.id,
                    content: payload.content,
                    isDeleted: payload.isDeleted || false,
                    createdAt: payload.createdAt,
                    senderId: payload.senderId,
                    hasAttachments: payload.attachments?.length > 0,
                  },
                  unreadCount:
                    c.id === activeId || payload.senderId === currentUserId
                      ? 0
                      : c.unreadCount + 1,
                  updatedAt: payload.createdAt,
                };
              }
              return c;
            })
          );
        } catch {}
      });

      eventSource.addEventListener("MESSAGE_READ", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.conversationId === activeId) {
            // Update read ticks
          }
        } catch {}
      });

      eventSource.addEventListener("CONVERSATION_UPDATED", async () => {
        // Refresh conversation list
        try {
          const res = await fetch("/api/messages/conversations");
          const json = await res.json();
          if (res.ok && json.success) {
            setConversations(json.data);
          }
        } catch {}
      });
    } catch {}

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [activeId, currentUserId]);

  const handleSendMessage = async (
    content: string,
    attachments?: AttachmentUploadItem[]
  ) => {
    if (!activeId) return;

    const res = await fetch(`/api/messages/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, attachments }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Failed to send message");
    }

    // Immediate optimistic local append if not received via SSE yet
    const createdMsg = json.data;
    setMessages((prev) => {
      if (prev.some((m) => m.id === createdMsg.id)) return prev;
      return [
        ...prev,
        {
          id: createdMsg.id,
          conversationId: createdMsg.conversationId,
          senderId: createdMsg.senderId,
          senderName: createdMsg.sender.fullName,
          content: createdMsg.content,
          isDeleted: false,
          isOwn: true,
          attachments: createdMsg.attachments || [],
          createdAt: createdMsg.createdAt,
        },
      ];
    });
  };

  return (
    <div className="h-[calc(100vh-120px)] min-h-[500px] border border-surface-dim rounded-xl bg-white shadow-sm overflow-hidden flex font-body">
      {/* Pane 1: Conversation List (Desktop 320px, Mobile toggle) */}
      <div className={`w-full lg:w-80 shrink-0 ${activeId ? "hidden lg:block" : "block"}`}>
        <ConversationList
          conversations={conversations}
          selectedId={activeId}
          onSelect={(id) => setActiveId(id)}
        />
      </div>

      {/* Pane 2: Active Chat View (Flex 1) */}
      <div className={`flex-1 flex flex-col min-w-0 ${!activeId ? "hidden lg:flex" : "flex"}`}>
        {activeConversation ? (
          <ChatView
            conversation={activeConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            onBackMobile={() => setActiveId(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-8 bg-surface-low">
            <EmptyState
              title="No Conversation Selected"
              description="Select a conversation from the list or start a new inquiry from the marketplace, services, or network directory."
            />
          </div>
        )}
      </div>

      {/* Pane 3: Context Details (Desktop 300px) */}
      {activeConversation && (
        <div className="hidden xl:block w-72 shrink-0">
          <ContextDetailsPanel
            contextType={activeConversation.contextType}
            contextId={activeConversation.contextId}
            contextSnapshot={activeConversation.contextSnapshot}
            otherUser={activeConversation.otherUser}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { NotificationItem, NotificationItemData } from "./notification-item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import {
  Bell,
  CheckCheck,
  Settings,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { NotificationType } from "@prisma/client";

export interface NotificationCenterViewProps {
  initialNotifications: NotificationItemData[];
  initialUnreadCount: number;
  currentUserId: string;
}

const CATEGORY_TABS: Array<{ label: string; value?: NotificationType | "UNREAD" }> = [
  { label: "All" },
  { label: "Unread", value: "UNREAD" },
  { label: "Orders", value: "ORDER_UPDATE" },
  { label: "Messages", value: "MESSAGE" },
  { label: "Network", value: "CONNECTION_REQUEST" },
  { label: "Services", value: "SERVICE_UPDATE" },
  { label: "Agent", value: "AGENT_UPDATE" },
  { label: "Verification", value: "VERIFICATION_UPDATE" },
  { label: "Marketplace", value: "PRODUCT_MODERATION" },
  { label: "System", value: "SYSTEM" },
];

export function NotificationCenterView({
  initialNotifications,
  initialUnreadCount,
  currentUserId,
}: NotificationCenterViewProps) {
  const [notifications, setNotifications] = useState<NotificationItemData[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch filtered notifications from server
  const fetchNotifications = useCallback(async (tabLabel: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const tab = CATEGORY_TABS.find((t) => t.label === tabLabel);
      const params = new URLSearchParams();

      if (tab?.value === "UNREAD") {
        params.set("unreadOnly", "true");
      } else if (tab?.value) {
        params.set("type", tab.value);
      }

      const res = await fetch(`/api/notifications?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setNotifications(json.data);
        if (json.pagination) {
          setUnreadCount(json.pagination.unreadCount);
        }
      } else {
        throw new Error(json.message || "Failed to load notifications");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTabChange = (label: string) => {
    setActiveTab(label);
    fetchNotifications(label);
  };

  // Realtime SSE Event Downlink listener
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/messages/events");

      eventSource.addEventListener("NOTIFICATION_CREATED", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (!payload.id) return;

          setNotifications((prev) => {
            if (prev.some((n) => n.id === payload.id)) return prev;
            return [
              {
                id: payload.id,
                type: payload.type,
                title: payload.title,
                body: payload.body,
                isRead: false,
                readAt: null,
                deepLink: payload.deepLink,
                resourceType: payload.resourceType,
                resourceId: payload.resourceId,
                createdAt: payload.createdAt || new Date().toISOString(),
              },
              ...prev,
            ];
          });

          setUnreadCount((c) => c + 1);
        } catch {}
      });
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {}
  };

  const handleMarkUnread = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/unread`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false, readAt: null } : n))
        );
        setUnreadCount((c) => c + 1);
      }
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch {}
  };

  return (
    <div className="space-y-6 font-body text-left max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
              Notification Hub
            </h1>
            {unreadCount > 0 && (
              <Badge variant="primary" size="sm">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-neutral">
            Stay updated with orders, inquiries, services, agent assignments, and network requests.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all as read</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(activeTab)}
            disabled={isLoading}
            className="text-xs px-2.5"
            aria-label="Refresh notifications"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Link href="/notifications/settings">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              <span>Preferences</span>
            </Button>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORY_TABS.map((tab) => {
          const isActive = tab.label === activeTab;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => handleTabChange(tab.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "bg-surface-low text-slate-neutral hover:bg-surface-dim hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-neutral space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-brand-primary" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No Notifications Found"
            description={
              activeTab === "All"
                ? "You have no notifications at this time. Activities from orders, network connections, and services will appear here."
                : `No notifications found in "${activeTab}".`
            }
          />
        ) : (
          notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkRead={handleMarkRead}
              onMarkUnread={handleMarkUnread}
            />
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import {
  Package,
  CreditCard,
  MessageSquare,
  UserPlus,
  Wrench,
  Briefcase,
  ShieldCheck,
  ShoppingBag,
  Bell,
  Check,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { NotificationType } from "@prisma/client";

export interface NotificationItemData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  deepLink?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface NotificationItemProps {
  notification: NotificationItemData;
  onMarkRead: (id: string) => Promise<void>;
  onMarkUnread: (id: string) => Promise<void>;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onMarkUnread,
}: NotificationItemProps) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "ORDER_UPDATE":
        return <Package className="h-4 w-4 text-status-warning" />;
      case "PAYMENT_UPDATE":
        return <CreditCard className="h-4 w-4 text-status-success" />;
      case "MESSAGE":
        return <MessageSquare className="h-4 w-4 text-brand-primary" />;
      case "CONNECTION_REQUEST":
        return <UserPlus className="h-4 w-4 text-status-info" />;
      case "SERVICE_UPDATE":
        return <Wrench className="h-4 w-4 text-accent-aqua" />;
      case "AGENT_UPDATE":
        return <Briefcase className="h-4 w-4 text-brand-primary" />;
      case "VERIFICATION_UPDATE":
        return <ShieldCheck className="h-4 w-4 text-status-success" />;
      case "PRODUCT_MODERATION":
        return <ShoppingBag className="h-4 w-4 text-status-error" />;
      case "SYSTEM":
      default:
        return <Bell className="h-4 w-4 text-slate-neutral" />;
    }
  };

  const getCategoryLabel = (type: NotificationType) => {
    switch (type) {
      case "ORDER_UPDATE":
        return "Orders";
      case "PAYMENT_UPDATE":
        return "Payments";
      case "MESSAGE":
        return "Messages";
      case "CONNECTION_REQUEST":
        return "Network";
      case "SERVICE_UPDATE":
        return "Services";
      case "AGENT_UPDATE":
        return "Agent Hub";
      case "VERIFICATION_UPDATE":
        return "Verification";
      case "PRODUCT_MODERATION":
        return "Marketplace";
      case "SYSTEM":
      default:
        return "System";
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all text-left font-body ${
        notification.isRead
          ? "bg-white border-surface-dim opacity-85 hover:opacity-100"
          : "bg-brand-primary/5 border-brand-primary/20 shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left icon & category */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-surface-low border border-surface-dim flex items-center justify-center shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={notification.isRead ? "secondary" : "primary"} size="sm">
                {getCategoryLabel(notification.type)}
              </Badge>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-brand-primary shrink-0" aria-label="Unread" />
              )}
              <span className="text-[11px] text-slate-neutral">
                {formatRelativeTime(new Date(notification.createdAt))}
              </span>
            </div>

            <strong className="font-heading font-bold text-xs sm:text-sm text-on-surface block">
              {notification.title}
            </strong>

            <p className="text-xs text-slate-neutral leading-relaxed">
              {notification.body}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {notification.isRead ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkUnread(notification.id)}
              className="h-8 px-2 text-[11px] gap-1"
              title="Mark as unread"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unread</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkRead(notification.id)}
              className="h-8 px-2 text-[11px] gap-1"
              title="Mark as read"
            >
              <Check className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Read</span>
            </Button>
          )}

          {notification.deepLink && (
            <Link href={notification.deepLink}>
              <Button variant="primary" size="sm" className="h-8 px-2.5 text-[11px] gap-1">
                <span>View</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

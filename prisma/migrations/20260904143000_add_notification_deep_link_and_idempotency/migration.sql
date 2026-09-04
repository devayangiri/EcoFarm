-- ====================================================
-- Migration: 20260904143000_add_notification_deep_link_and_idempotency
-- Adds deepLink and idempotencyKey to notifications table
-- ====================================================

-- 1. Alter Table: notifications (add missing columns)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "deepLink" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

-- 2. Create Indexes: notifications
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_userId_idempotencyKey_key" ON "notifications"("userId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

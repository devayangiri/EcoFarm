-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKOUT', 'CONVERTED', 'ABANDONED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "CheckoutSessionStatus" AS ENUM ('ACTIVE', 'PAYMENT_PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'RELEASED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN', 'REMOVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: inventory_reservations
ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "inventory_reservations" ADD COLUMN IF NOT EXISTS "releasedAt" TIMESTAMP(3);

-- CreateIndex: inventory_reservations
CREATE INDEX IF NOT EXISTS "inventory_reservations_status_idx" ON "inventory_reservations"("status");

-- CreateTable: carts
CREATE TABLE IF NOT EXISTS "carts" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: cart_items
CREATE TABLE IF NOT EXISTS "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: checkout_sessions
CREATE TABLE IF NOT EXISTS "checkout_sessions" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "status" "CheckoutSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "shippingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "shippingAddressSnapshot" JSONB,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "orderGroupId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: order_timelines
CREATE TABLE IF NOT EXISTS "order_timelines" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable: saved_products
CREATE TABLE IF NOT EXISTS "saved_products" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "moderatedById" TEXT,
    "moderationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- Indexes for carts
CREATE INDEX IF NOT EXISTS "carts_buyerId_idx" ON "carts"("buyerId");
CREATE INDEX IF NOT EXISTS "carts_status_idx" ON "carts"("status");

-- Indexes for cart_items
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cartId_productId_key" ON "cart_items"("cartId", "productId");
CREATE INDEX IF NOT EXISTS "cart_items_cartId_idx" ON "cart_items"("cartId");
CREATE INDEX IF NOT EXISTS "cart_items_productId_idx" ON "cart_items"("productId");
CREATE INDEX IF NOT EXISTS "cart_items_sellerId_idx" ON "cart_items"("sellerId");

-- Indexes for checkout_sessions
CREATE INDEX IF NOT EXISTS "checkout_sessions_buyerId_idx" ON "checkout_sessions"("buyerId");
CREATE INDEX IF NOT EXISTS "checkout_sessions_cartId_idx" ON "checkout_sessions"("cartId");
CREATE INDEX IF NOT EXISTS "checkout_sessions_status_idx" ON "checkout_sessions"("status");
CREATE INDEX IF NOT EXISTS "checkout_sessions_expiresAt_idx" ON "checkout_sessions"("expiresAt");

-- Indexes for order_timelines
CREATE INDEX IF NOT EXISTS "order_timelines_orderId_idx" ON "order_timelines"("orderId");
CREATE INDEX IF NOT EXISTS "order_timelines_status_idx" ON "order_timelines"("status");

-- Indexes for saved_products
CREATE UNIQUE INDEX IF NOT EXISTS "saved_products_buyerId_productId_key" ON "saved_products"("buyerId", "productId");
CREATE INDEX IF NOT EXISTS "saved_products_buyerId_idx" ON "saved_products"("buyerId");
CREATE INDEX IF NOT EXISTS "saved_products_productId_idx" ON "saved_products"("productId");

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS "reviews_targetType_targetId_idx" ON "reviews"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "reviews_authorId_idx" ON "reviews"("authorId");
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status");

-- Foreign key constraints
DO $$ BEGIN
    ALTER TABLE "carts" ADD CONSTRAINT "carts_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "order_timelines" ADD CONSTRAINT "order_timelines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "saved_products" ADD CONSTRAINT "saved_products_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "saved_products" ADD CONSTRAINT "saved_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

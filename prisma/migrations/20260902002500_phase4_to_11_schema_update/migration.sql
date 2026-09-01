-- ====================================================
-- Migration: 20260902002500_phase4_to_11_schema_update
-- Brings database schema to 100% parity with schema.prisma
-- ====================================================

-- 1. New Enums
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "ServiceRequestStatus" AS ENUM ('OPEN', 'QUOTATION_SUBMITTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ServiceQuotationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CONVERTED', 'LOST');
CREATE TYPE "LeadActivityType" AS ENUM ('CALL', 'MESSAGE', 'MEETING', 'NOTE', 'FOLLOW_UP', 'STATUS_CHANGE');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'RELEASED', 'EXPIRED');
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CHECKOUT', 'CONVERTED', 'ABANDONED');
CREATE TYPE "CheckoutSessionStatus" AS ENUM ('ACTIVE', 'PAYMENT_PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED', 'CLOSED');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TYPE "ReportTargetType" AS ENUM ('PRODUCT', 'USER', 'BUSINESS', 'SERVICE', 'MESSAGE', 'REVIEW');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN', 'REMOVED');

-- 2. Alter Existing Tables (Add Missing Columns)
ALTER TABLE "provider_profiles" ADD COLUMN "experienceYears" INTEGER DEFAULT 0;
ALTER TABLE "service_listings" ADD COLUMN "sector" "Sector" NOT NULL DEFAULT 'AGRICULTURE';
ALTER TABLE "service_listings" ADD COLUMN "serviceArea" TEXT;
ALTER TABLE "service_listings" ADD COLUMN "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "inventory_reservations" ADD COLUMN "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "inventory_reservations" ADD COLUMN "releasedAt" TIMESTAMP(3);
ALTER TABLE "network_profiles" ADD COLUMN "participantType" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN "businessCategory" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN "sector" "Sector" DEFAULT 'AGRICULTURE';
ALTER TABLE "network_profiles" ADD COLUMN "district" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN "state" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "network_profiles" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "conversations" ADD COLUMN "contextType" "MessageContextType" DEFAULT 'GENERAL';
ALTER TABLE "conversations" ADD COLUMN "contextId" TEXT;
ALTER TABLE "conversations" ADD COLUMN "contextSnapshot" JSONB;
ALTER TABLE "messages" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN "deletedById" TEXT;
ALTER TABLE "notifications" ADD COLUMN "deepLink" TEXT;
ALTER TABLE "notifications" ADD COLUMN "idempotencyKey" TEXT;

-- 3. New Tables
CREATE TABLE "agent_leads" (

    "id" TEXT NOT NULL,
    "agentProfileId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "source" TEXT,
    "targetSector" "Sector" NOT NULL DEFAULT 'AGRICULTURE',
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "estimatedValue" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_leads_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "lead_activities" (

    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "agentProfileId" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "agent_tasks" (

    "id" TEXT NOT NULL,
    "agentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "linkedLeadId" TEXT,
    "linkedTargetType" "AgentTargetType",
    "linkedTargetUserId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_tasks_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "agent_notes" (

    "id" TEXT NOT NULL,
    "agentProfileId" TEXT NOT NULL,
    "targetType" "AgentTargetType" NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_notes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "service_requests" (

    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requiredDate" TIMESTAMP(3) NOT NULL,
    "quantityOrScale" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "locationVillageOrStreet" TEXT,
    "locationCityOrTown" TEXT NOT NULL,
    "locationDistrict" TEXT NOT NULL,
    "locationState" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'OPEN',
    "acceptedQuotationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "service_quotations" (

    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "terms" TEXT,
    "notes" TEXT,
    "status" "ServiceQuotationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_quotations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "service_request_timelines" (

    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_timelines_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "carts" (

    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "cart_items" (

    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "checkout_sessions" (

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
CREATE TABLE "order_timelines" (

    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_timelines_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "message_attachments" (

    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "saved_products" (

    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_products_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "buyer_requirements" (

    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sector" "Sector" NOT NULL DEFAULT 'AGRICULTURE',
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "targetPricePerUnit" DECIMAL(12,2),
    "locationDistrict" TEXT NOT NULL,
    "locationState" TEXT NOT NULL,
    "deliveryExpectation" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_requirements_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "disputes" (

    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "serviceRequestId" TEXT,
    "raisedById" TEXT NOT NULL,
    "respondentId" TEXT,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "reports" (

    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "reviews" (

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
CREATE TABLE "admin_settings" (

    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- 4. New Indexes
CREATE INDEX "agent_leads_agentProfileId_idx" ON "agent_leads"("agentProfileId");
CREATE INDEX "agent_leads_stage_idx" ON "agent_leads"("stage");
CREATE INDEX "agent_leads_targetSector_idx" ON "agent_leads"("targetSector");
CREATE INDEX "lead_activities_leadId_idx" ON "lead_activities"("leadId");
CREATE INDEX "lead_activities_agentProfileId_idx" ON "lead_activities"("agentProfileId");
CREATE INDEX "agent_tasks_agentProfileId_idx" ON "agent_tasks"("agentProfileId");
CREATE INDEX "agent_tasks_status_idx" ON "agent_tasks"("status");
CREATE INDEX "agent_tasks_dueDate_idx" ON "agent_tasks"("dueDate");
CREATE INDEX "agent_tasks_priority_idx" ON "agent_tasks"("priority");
CREATE INDEX "agent_notes_agentProfileId_idx" ON "agent_notes"("agentProfileId");
CREATE INDEX "agent_notes_targetType_targetUserId_idx" ON "agent_notes"("targetType", "targetUserId");
CREATE INDEX "service_listings_sector_idx" ON "service_listings"("sector");
CREATE INDEX "service_listings_status_idx" ON "service_listings"("status");
CREATE INDEX "service_listings_locationState_locationDistrict_idx" ON "service_listings"("locationState", "locationDistrict");
CREATE UNIQUE INDEX "service_requests_requestNumber_key" ON "service_requests"("requestNumber");
CREATE UNIQUE INDEX "service_requests_acceptedQuotationId_key" ON "service_requests"("acceptedQuotationId");
CREATE INDEX "service_requests_serviceId_idx" ON "service_requests"("serviceId");
CREATE INDEX "service_requests_requesterId_idx" ON "service_requests"("requesterId");
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");
CREATE INDEX "service_requests_requestNumber_idx" ON "service_requests"("requestNumber");
CREATE UNIQUE INDEX "service_quotations_quotationNumber_key" ON "service_quotations"("quotationNumber");
CREATE INDEX "service_quotations_serviceRequestId_idx" ON "service_quotations"("serviceRequestId");
CREATE INDEX "service_quotations_providerId_idx" ON "service_quotations"("providerId");
CREATE INDEX "service_quotations_status_idx" ON "service_quotations"("status");
CREATE INDEX "service_quotations_quotationNumber_idx" ON "service_quotations"("quotationNumber");
CREATE INDEX "service_request_timelines_serviceRequestId_idx" ON "service_request_timelines"("serviceRequestId");
CREATE INDEX "service_request_timelines_status_idx" ON "service_request_timelines"("status");
CREATE INDEX "carts_buyerId_idx" ON "carts"("buyerId");
CREATE INDEX "carts_status_idx" ON "carts"("status");
CREATE INDEX "cart_items_cartId_idx" ON "cart_items"("cartId");
CREATE INDEX "cart_items_productId_idx" ON "cart_items"("productId");
CREATE INDEX "cart_items_sellerId_idx" ON "cart_items"("sellerId");
CREATE UNIQUE INDEX "cart_items_cartId_productId_key" ON "cart_items"("cartId", "productId");
CREATE INDEX "checkout_sessions_buyerId_idx" ON "checkout_sessions"("buyerId");
CREATE INDEX "checkout_sessions_cartId_idx" ON "checkout_sessions"("cartId");
CREATE INDEX "checkout_sessions_status_idx" ON "checkout_sessions"("status");
CREATE INDEX "checkout_sessions_expiresAt_idx" ON "checkout_sessions"("expiresAt");
CREATE INDEX "inventory_reservations_status_idx" ON "inventory_reservations"("status");
CREATE INDEX "order_timelines_orderId_idx" ON "order_timelines"("orderId");
CREATE INDEX "order_timelines_status_idx" ON "order_timelines"("status");
CREATE INDEX "network_profiles_participantType_idx" ON "network_profiles"("participantType");
CREATE INDEX "network_profiles_businessCategory_idx" ON "network_profiles"("businessCategory");
CREATE INDEX "network_profiles_sector_idx" ON "network_profiles"("sector");
CREATE INDEX "network_profiles_state_district_idx" ON "network_profiles"("state", "district");
CREATE INDEX "network_profiles_isVerified_idx" ON "network_profiles"("isVerified");
CREATE INDEX "conversations_contextType_contextId_idx" ON "conversations"("contextType", "contextId");
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");
CREATE INDEX "message_attachments_messageId_idx" ON "message_attachments"("messageId");
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");
CREATE UNIQUE INDEX "notifications_userId_idempotencyKey_key" ON "notifications"("userId", "idempotencyKey");
CREATE INDEX "saved_products_buyerId_idx" ON "saved_products"("buyerId");
CREATE INDEX "saved_products_productId_idx" ON "saved_products"("productId");
CREATE UNIQUE INDEX "saved_products_buyerId_productId_key" ON "saved_products"("buyerId", "productId");
CREATE INDEX "buyer_requirements_buyerId_idx" ON "buyer_requirements"("buyerId");
CREATE INDEX "buyer_requirements_sector_idx" ON "buyer_requirements"("sector");
CREATE INDEX "buyer_requirements_category_idx" ON "buyer_requirements"("category");
CREATE INDEX "buyer_requirements_status_idx" ON "buyer_requirements"("status");
CREATE INDEX "buyer_requirements_locationState_locationDistrict_idx" ON "buyer_requirements"("locationState", "locationDistrict");
CREATE INDEX "disputes_status_idx" ON "disputes"("status");
CREATE INDEX "disputes_raisedById_idx" ON "disputes"("raisedById");
CREATE INDEX "disputes_respondentId_idx" ON "disputes"("respondentId");
CREATE INDEX "disputes_orderId_idx" ON "disputes"("orderId");
CREATE INDEX "disputes_serviceRequestId_idx" ON "disputes"("serviceRequestId");
CREATE INDEX "reports_status_idx" ON "reports"("status");
CREATE INDEX "reports_targetType_targetId_idx" ON "reports"("targetType", "targetId");
CREATE INDEX "reports_reporterId_idx" ON "reports"("reporterId");
CREATE INDEX "reviews_targetType_targetId_idx" ON "reviews"("targetType", "targetId");
CREATE INDEX "reviews_authorId_idx" ON "reviews"("authorId");
CREATE INDEX "reviews_status_idx" ON "reviews"("status");
CREATE UNIQUE INDEX "admin_settings_key_key" ON "admin_settings"("key");
CREATE INDEX "admin_settings_category_idx" ON "admin_settings"("category");

-- 5. Foreign Key Constraints
ALTER TABLE "agent_leads" ADD CONSTRAINT "agent_leads_agentProfileId_fkey" FOREIGN KEY ("agentProfileId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "agent_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_agentProfileId_fkey" FOREIGN KEY ("agentProfileId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_agentProfileId_fkey" FOREIGN KEY ("agentProfileId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_linkedLeadId_fkey" FOREIGN KEY ("linkedLeadId") REFERENCES "agent_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agent_notes" ADD CONSTRAINT "agent_notes_agentProfileId_fkey" FOREIGN KEY ("agentProfileId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_quotations" ADD CONSTRAINT "service_quotations_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_quotations" ADD CONSTRAINT "service_quotations_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_request_timelines" ADD CONSTRAINT "service_request_timelines_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "carts" ADD CONSTRAINT "carts_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_timelines" ADD CONSTRAINT "order_timelines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_products" ADD CONSTRAINT "saved_products_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_products" ADD CONSTRAINT "saved_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_requirements" ADD CONSTRAINT "buyer_requirements_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'kitchen', 'cashier');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('awaiting_payment', 'pending', 'preparing', 'ready', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'mobile_money', 'airtel_money', 'moov_money', 'card');

-- CreateEnum
CREATE TYPE "payment_timing" AS ENUM ('before_meal', 'after_meal');

-- CreateEnum
CREATE TYPE "stock_movement_type" AS ENUM ('manual_in', 'manual_out', 'adjustment', 'order_out', 'sale_manual', 'purchase');

-- CreateEnum
CREATE TYPE "inventory_scope" AS ENUM ('operational', 'warehouse');

-- CreateEnum
CREATE TYPE "inventory_status" AS ENUM ('draft', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "ticket_priority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "log_level" AS ENUM ('info', 'warning', 'error', 'critical');

-- CreateEnum
CREATE TYPE "permission_resource" AS ENUM ('restaurants', 'users', 'menu', 'categories', 'products', 'tables', 'orders', 'stocks', 'payments', 'stats', 'roles');

-- CreateEnum
CREATE TYPE "permission_action" AS ENUM ('create', 'read', 'update', 'delete', 'manage');

-- CreateEnum
CREATE TYPE "invitation_status" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('starter', 'business', 'premium');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('trial', 'active', 'expired', 'suspended', 'cancelled');

-- CreateEnum
CREATE TYPE "subscription_payment_method" AS ENUM ('manual', 'airtel_money', 'moov_money', 'mobile_money', 'card');

-- CreateEnum
CREATE TYPE "subscription_payment_status" AS ENUM ('pending', 'confirmed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "product_type" AS ENUM ('good', 'service');

-- CreateEnum
CREATE TYPE "restaurant_verification_status" AS ENUM ('pending_documents', 'documents_submitted', 'documents_rejected', 'verified', 'suspended');

-- CreateEnum
CREATE TYPE "order_source" AS ENUM ('qr_table', 'public_link', 'dashboard', 'counter', 'mobile_pos');

-- CreateEnum
CREATE TYPE "fulfillment_type" AS ENUM ('table', 'takeway', 'delivery', 'reservation');

-- CreateEnum
CREATE TYPE "cash_session_status" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "revenue_type" AS ENUM ('good', 'service');

-- CreateEnum
CREATE TYPE "expense_category" AS ENUM ('stock_purchase', 'salary', 'utilities', 'transport', 'maintenance', 'marketing', 'rent', 'other');

-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('restaurant', 'retail', 'transport', 'vehicle_rental', 'service_rental', 'hotel', 'beauty', 'other');

-- CreateEnum
CREATE TYPE "singpay_transaction_status" AS ENUM ('start', 'partenaire', 'terminate', 'disbursement', 'refund');

-- CreateEnum
CREATE TYPE "singpay_transaction_result" AS ENUM ('success', 'password_error', 'balance_error', 'timeout_error', 'error', 'pending');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('support_reply', 'support_ticket_resolved', 'verification_approved', 'verification_rejected', 'circuit_sheet_deadline', 'payment_received', 'payment_failed', 'subscription_paid', 'subscription_expiring', 'subscription_suspended', 'low_stock_alert', 'slow_order_alert', 'new_invitation_accepted', 'new_support_ticket', 'support_client_reply', 'new_verification_submitted', 'new_subscription_payment');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "logo_url" TEXT,
    "cover_image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "activity_type" "activity_type" NOT NULL DEFAULT 'restaurant',
    "ebilling_username" TEXT,
    "ebilling_shared_key" TEXT,
    "ebilling_configured" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" "restaurant_verification_status" NOT NULL DEFAULT 'pending_documents',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_modules" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "module_key" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "enabled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabled_by" UUID,

    CONSTRAINT "restaurant_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_users" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "role" "user_role",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role_id" UUID,

    CONSTRAINT "restaurant_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "category_id" UUID,
    "family_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "product_type" "product_type" NOT NULL DEFAULT 'good',
    "price" INTEGER,
    "include_price" BOOLEAN NOT NULL DEFAULT true,
    "purchase_price" INTEGER,
    "has_stock" BOOLEAN NOT NULL DEFAULT true,
    "barcode" TEXT,
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "alert_threshold" INTEGER NOT NULL DEFAULT 5,
    "avg_cost" INTEGER,
    "last_purchase_price" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_sessions" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "scope" "inventory_scope" NOT NULL,
    "status" "inventory_status" NOT NULL DEFAULT 'draft',
    "label" TEXT,
    "created_by" UUID NOT NULL,
    "completed_by" UUID,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_lines" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "product_id" UUID,
    "warehouse_product_id" UUID,
    "expected_qty" DECIMAL(10,2) NOT NULL,
    "counted_qty" DECIMAL(10,2),
    "unit_cost" DECIMAL(10,2),
    "notes" TEXT,
    "counted_by" UUID,
    "counted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "table_id" UUID,
    "order_number" TEXT,
    "customer_name" TEXT,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "table_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "source" "order_source" NOT NULL DEFAULT 'qr_table',
    "fulfillmentType" "fulfillment_type",
    "stock_deducted" BOOLEAN NOT NULL DEFAULT false,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "pickup_time" TIMESTAMP(3),
    "reservation_date" TIMESTAMP(3),
    "party_size" INTEGER,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "payment_method" NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "timing" "payment_timing" NOT NULL,
    "transaction_id" TEXT,
    "phone_number" TEXT,
    "error_message" TEXT,
    "singpay_reference" TEXT,
    "singpay_transaction_id" TEXT,
    "singpay_status" "singpay_transaction_status",
    "singpay_result" "singpay_transaction_result",
    "singpay_airtel_id" TEXT,
    "callback_received" BOOLEAN NOT NULL DEFAULT false,
    "callback_data" JSONB,
    "callback_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "stock_movement_type" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previous_qty" INTEGER NOT NULL,
    "new_qty" INTEGER NOT NULL,
    "reason" TEXT,
    "order_id" UUID,
    "purchase_price" INTEGER,
    "extra_costs" INTEGER,
    "unit_cost" INTEGER,
    "avg_cost_after" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ticket_status" NOT NULL DEFAULT 'open',
    "priority" "ticket_priority" NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stats" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "restaurant_id" UUID,
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,
    "avg_order_value" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" UUID NOT NULL,
    "level" "log_level" NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "user_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "color" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_protected" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "resource" "permission_resource" NOT NULL,
    "action" "permission_action" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "status" "invitation_status" NOT NULL DEFAULT 'pending',
    "invited_by" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "plan" "subscription_plan" NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'trial',
    "trial_starts_at" TIMESTAMP(3) NOT NULL,
    "trial_ends_at" TIMESTAMP(3) NOT NULL,
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "active_users_count" INTEGER NOT NULL DEFAULT 1,
    "base_plan_price" INTEGER NOT NULL,
    "billing_cycle" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "subscription_payment_method" NOT NULL,
    "status" "subscription_payment_status" NOT NULL DEFAULT 'pending',
    "billing_cycle" INTEGER NOT NULL,
    "proof_url" TEXT,
    "manual_notes" TEXT,
    "validated_by" UUID,
    "validated_at" TIMESTAMP(3),
    "singpay_reference" TEXT,
    "singpay_transaction_id" TEXT,
    "transaction_id" TEXT,
    "phone_number" TEXT,
    "provider" TEXT,
    "callback_received" BOOLEAN NOT NULL DEFAULT false,
    "callback_data" JSONB,
    "callback_at" TIMESTAMP(3),
    "error_message" TEXT,
    "userCount" INTEGER NOT NULL DEFAULT 1,
    "paid_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_email_logs" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "email_type" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "error_message" TEXT,

    CONSTRAINT "subscription_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_verification_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "profile_photo_url" TEXT,
    "profile_photo_uploaded_at" TIMESTAMP(3),
    "identity_document_url" TEXT,
    "identity_document_type" TEXT,
    "identity_document_uploaded_at" TIMESTAMP(3),
    "verification_status" "restaurant_verification_status" NOT NULL DEFAULT 'pending_documents',
    "verified_by" UUID,
    "verified_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "rejected_by" UUID,
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_circuit_sheets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "circuit_sheet_url" TEXT,
    "circuit_sheet_uploaded_at" TIMESTAMP(3),
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "is_submitted" BOOLEAN NOT NULL DEFAULT false,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "validated_by" UUID,
    "validated_at" TIMESTAMP(3),
    "auto_suspended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_circuit_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_verification_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "old_status" "restaurant_verification_status",
    "new_status" "restaurant_verification_status",
    "performed_by" UUID,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_verification_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_products" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100),
    "description" TEXT,
    "storage_unit" VARCHAR(50) NOT NULL,
    "units_per_storage" INTEGER NOT NULL DEFAULT 1,
    "image_url" TEXT,
    "category" VARCHAR(100),
    "linked_product_id" UUID,
    "conversion_ratio" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "warehouse_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_stock" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "warehouse_product_id" UUID NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "alert_threshold" DECIMAL(10,2) NOT NULL DEFAULT 10,
    "unit_cost" DECIMAL(10,2),
    "last_inventory_date" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "warehouse_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_movements" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "warehouse_product_id" UUID NOT NULL,
    "movement_type" VARCHAR(50) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "previous_qty" DECIMAL(10,2) NOT NULL,
    "new_qty" DECIMAL(10,2) NOT NULL,
    "supplier_name" VARCHAR(255),
    "invoice_reference" VARCHAR(100),
    "destination" VARCHAR(100),
    "reason" TEXT,
    "performed_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_to_ops_transfers" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "warehouse_product_id" UUID NOT NULL,
    "warehouse_quantity" DECIMAL(10,2) NOT NULL,
    "ops_product_id" UUID NOT NULL,
    "ops_quantity" DECIMAL(10,2) NOT NULL,
    "conversion_ratio" DECIMAL(10,2) NOT NULL,
    "transferred_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_to_ops_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_sessions" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "session_date" DATE NOT NULL,
    "status" "cash_session_status" NOT NULL DEFAULT 'open',
    "opening_balance" INTEGER NOT NULL DEFAULT 0,
    "closing_balance" INTEGER,
    "theoretical_balance" INTEGER,
    "balance_difference" INTEGER,
    "notes" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "opened_by" UUID NOT NULL,
    "closed_by" UUID,
    "is_historical" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_revenues" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "product_id" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_amount" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "revenue_type" "revenue_type" NOT NULL DEFAULT 'service',
    "notes" TEXT,
    "revenue_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "stock_movement_id" UUID,

    CONSTRAINT "manual_revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" "expense_category" NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "product_id" UUID,
    "quantity_added" INTEGER,
    "notes" TEXT,
    "expense_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "stock_movement_id" UUID,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_singpay_configs" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "wallet_id" TEXT,
    "merchant_code" TEXT,
    "default_disbursement_id" TEXT,
    "callback_url" TEXT,
    "is_configured" BOOLEAN NOT NULL DEFAULT false,
    "configured_at" TIMESTAMP(3),
    "configured_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_singpay_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "restaurant_id" UUID,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "action_url" TEXT,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "in_app" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE INDEX "restaurants_slug_idx" ON "restaurants"("slug");

-- CreateIndex
CREATE INDEX "restaurants_is_active_idx" ON "restaurants"("is_active");

-- CreateIndex
CREATE INDEX "restaurants_verification_status_idx" ON "restaurants"("verification_status");

-- CreateIndex
CREATE INDEX "restaurant_modules_restaurant_id_is_enabled_idx" ON "restaurant_modules"("restaurant_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_modules_restaurant_id_module_key_key" ON "restaurant_modules"("restaurant_id", "module_key");

-- CreateIndex
CREATE INDEX "restaurant_users_user_id_idx" ON "restaurant_users"("user_id");

-- CreateIndex
CREATE INDEX "restaurant_users_restaurant_id_idx" ON "restaurant_users"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_users_user_id_restaurant_id_key" ON "restaurant_users"("user_id", "restaurant_id");

-- CreateIndex
CREATE INDEX "tables_restaurant_id_is_active_idx" ON "tables"("restaurant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "tables_restaurant_id_number_key" ON "tables"("restaurant_id", "number");

-- CreateIndex
CREATE INDEX "categories_restaurant_id_idx" ON "categories"("restaurant_id");

-- CreateIndex
CREATE INDEX "categories_restaurant_id_is_active_idx" ON "categories"("restaurant_id", "is_active");

-- CreateIndex
CREATE INDEX "categories_restaurant_id_position_idx" ON "categories"("restaurant_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "categories_restaurant_id_name_key" ON "categories"("restaurant_id", "name");

-- CreateIndex
CREATE INDEX "families_restaurant_id_idx" ON "families"("restaurant_id");

-- CreateIndex
CREATE INDEX "families_category_id_idx" ON "families"("category_id");

-- CreateIndex
CREATE INDEX "families_restaurant_id_category_id_position_idx" ON "families"("restaurant_id", "category_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "families_restaurant_id_category_id_name_key" ON "families"("restaurant_id", "category_id", "name");

-- CreateIndex
CREATE INDEX "products_restaurant_id_category_id_idx" ON "products"("restaurant_id", "category_id");

-- CreateIndex
CREATE INDEX "products_restaurant_id_is_available_idx" ON "products"("restaurant_id", "is_available");

-- CreateIndex
CREATE INDEX "products_restaurant_id_product_type_idx" ON "products"("restaurant_id", "product_type");

-- CreateIndex
CREATE INDEX "products_restaurant_id_has_stock_idx" ON "products"("restaurant_id", "has_stock");

-- CreateIndex
CREATE INDEX "products_restaurant_id_barcode_idx" ON "products"("restaurant_id", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_product_id_key" ON "stocks"("product_id");

-- CreateIndex
CREATE INDEX "stocks_product_id_idx" ON "stocks"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_restaurant_id_product_id_key" ON "stocks"("restaurant_id", "product_id");

-- CreateIndex
CREATE INDEX "inventory_sessions_restaurant_id_status_idx" ON "inventory_sessions"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "inventory_sessions_restaurant_id_created_at_idx" ON "inventory_sessions"("restaurant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "inventory_lines_session_id_idx" ON "inventory_lines"("session_id");

-- CreateIndex
CREATE INDEX "inventory_lines_restaurant_id_product_id_idx" ON "inventory_lines"("restaurant_id", "product_id");

-- CreateIndex
CREATE INDEX "inventory_lines_restaurant_id_warehouse_product_id_idx" ON "inventory_lines"("restaurant_id", "warehouse_product_id");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_status_idx" ON "orders"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_created_at_idx" ON "orders"("restaurant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_isArchived_status_idx" ON "orders"("isArchived", "status");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_table_id_idx" ON "orders"("restaurant_id", "table_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_restaurant_id_order_number_key" ON "orders"("restaurant_id", "order_number");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_singpay_reference_key" ON "payments"("singpay_reference");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_restaurant_id_status_idx" ON "payments"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "payments_restaurant_id_created_at_idx" ON "payments"("restaurant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payments_singpay_reference_idx" ON "payments"("singpay_reference");

-- CreateIndex
CREATE INDEX "stock_movements_restaurant_id_product_id_idx" ON "stock_movements"("restaurant_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_movements_restaurant_id_created_at_idx" ON "stock_movements"("restaurant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "support_tickets_restaurant_id_status_idx" ON "support_tickets"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "support_tickets_status_priority_idx" ON "support_tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "ticket_messages_ticket_id_idx" ON "ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "daily_stats_date_idx" ON "daily_stats"("date");

-- CreateIndex
CREATE INDEX "daily_stats_restaurant_id_date_idx" ON "daily_stats"("restaurant_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_date_restaurant_id_key" ON "daily_stats"("date", "restaurant_id");

-- CreateIndex
CREATE INDEX "system_logs_level_created_at_idx" ON "system_logs"("level", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_logs_action_idx" ON "system_logs"("action");

-- CreateIndex
CREATE INDEX "roles_restaurant_id_is_active_idx" ON "roles"("restaurant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "roles_restaurant_id_name_key" ON "roles"("restaurant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_restaurant_id_slug_key" ON "roles"("restaurant_id", "slug");

-- CreateIndex
CREATE INDEX "permissions_category_idx" ON "permissions"("category");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_restaurant_id_status_idx" ON "invitations"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_restaurant_id_key" ON "subscriptions"("restaurant_id");

-- CreateIndex
CREATE INDEX "subscriptions_restaurant_id_status_idx" ON "subscriptions"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_status_current_period_end_idx" ON "subscriptions"("status", "current_period_end");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_singpay_reference_key" ON "subscription_payments"("singpay_reference");

-- CreateIndex
CREATE INDEX "subscription_payments_subscription_id_idx" ON "subscription_payments"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_payments_restaurant_id_status_idx" ON "subscription_payments"("restaurant_id", "status");

-- CreateIndex
CREATE INDEX "subscription_payments_status_created_at_idx" ON "subscription_payments"("status", "created_at");

-- CreateIndex
CREATE INDEX "subscription_payments_singpay_reference_idx" ON "subscription_payments"("singpay_reference");

-- CreateIndex
CREATE INDEX "subscription_email_logs_subscription_id_email_type_idx" ON "subscription_email_logs"("subscription_id", "email_type");

-- CreateIndex
CREATE INDEX "subscription_email_logs_restaurant_id_sent_at_idx" ON "subscription_email_logs"("restaurant_id", "sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_verification_documents_restaurant_id_key" ON "restaurant_verification_documents"("restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_verification_documents_restaurant_id_idx" ON "restaurant_verification_documents"("restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_verification_documents_verification_status_idx" ON "restaurant_verification_documents"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_circuit_sheets_restaurant_id_key" ON "restaurant_circuit_sheets"("restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_circuit_sheets_restaurant_id_idx" ON "restaurant_circuit_sheets"("restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_circuit_sheets_deadline_at_idx" ON "restaurant_circuit_sheets"("deadline_at");

-- CreateIndex
CREATE INDEX "restaurant_verification_history_restaurant_id_idx" ON "restaurant_verification_history"("restaurant_id");

-- CreateIndex
CREATE INDEX "restaurant_verification_history_event_type_idx" ON "restaurant_verification_history"("event_type");

-- CreateIndex
CREATE INDEX "restaurant_verification_history_created_at_idx" ON "restaurant_verification_history"("created_at" DESC);

-- CreateIndex
CREATE INDEX "warehouse_products_restaurant_id_idx" ON "warehouse_products"("restaurant_id");

-- CreateIndex
CREATE INDEX "warehouse_products_linked_product_id_idx" ON "warehouse_products"("linked_product_id");

-- CreateIndex
CREATE INDEX "warehouse_stock_restaurant_id_idx" ON "warehouse_stock"("restaurant_id");

-- CreateIndex
CREATE INDEX "warehouse_stock_warehouse_product_id_idx" ON "warehouse_stock"("warehouse_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_stock_restaurant_id_warehouse_product_id_key" ON "warehouse_stock"("restaurant_id", "warehouse_product_id");

-- CreateIndex
CREATE INDEX "warehouse_movements_restaurant_id_idx" ON "warehouse_movements"("restaurant_id");

-- CreateIndex
CREATE INDEX "warehouse_movements_warehouse_product_id_idx" ON "warehouse_movements"("warehouse_product_id");

-- CreateIndex
CREATE INDEX "warehouse_movements_movement_type_idx" ON "warehouse_movements"("movement_type");

-- CreateIndex
CREATE INDEX "warehouse_movements_restaurant_id_created_at_idx" ON "warehouse_movements"("restaurant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "warehouse_to_ops_transfers_restaurant_id_idx" ON "warehouse_to_ops_transfers"("restaurant_id");

-- CreateIndex
CREATE INDEX "warehouse_to_ops_transfers_warehouse_product_id_idx" ON "warehouse_to_ops_transfers"("warehouse_product_id");

-- CreateIndex
CREATE INDEX "warehouse_to_ops_transfers_ops_product_id_idx" ON "warehouse_to_ops_transfers"("ops_product_id");

-- CreateIndex
CREATE INDEX "cash_sessions_restaurant_id_session_date_idx" ON "cash_sessions"("restaurant_id", "session_date" DESC);

-- CreateIndex
CREATE INDEX "cash_sessions_restaurant_id_status_idx" ON "cash_sessions"("restaurant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cash_sessions_restaurant_id_session_date_key" ON "cash_sessions"("restaurant_id", "session_date");

-- CreateIndex
CREATE UNIQUE INDEX "manual_revenues_stock_movement_id_key" ON "manual_revenues"("stock_movement_id");

-- CreateIndex
CREATE INDEX "manual_revenues_restaurant_id_session_id_idx" ON "manual_revenues"("restaurant_id", "session_id");

-- CreateIndex
CREATE INDEX "manual_revenues_restaurant_id_revenue_date_idx" ON "manual_revenues"("restaurant_id", "revenue_date");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_stock_movement_id_key" ON "expenses"("stock_movement_id");

-- CreateIndex
CREATE INDEX "expenses_restaurant_id_session_id_idx" ON "expenses"("restaurant_id", "session_id");

-- CreateIndex
CREATE INDEX "expenses_restaurant_id_category_idx" ON "expenses"("restaurant_id", "category");

-- CreateIndex
CREATE INDEX "expenses_restaurant_id_expense_date_idx" ON "expenses"("restaurant_id", "expense_date");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_singpay_configs_restaurant_id_key" ON "restaurant_singpay_configs"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_singpay_configs_wallet_id_key" ON "restaurant_singpay_configs"("wallet_id");

-- CreateIndex
CREATE INDEX "restaurant_singpay_configs_wallet_id_idx" ON "restaurant_singpay_configs"("wallet_id");

-- CreateIndex
CREATE INDEX "restaurant_singpay_configs_enabled_idx" ON "restaurant_singpay_configs"("enabled");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_restaurant_id_idx" ON "notifications"("restaurant_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries"("notification_id");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries"("status");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_type_key" ON "notification_preferences"("user_id", "type");

-- AddForeignKey
ALTER TABLE "restaurant_modules" ADD CONSTRAINT "restaurant_modules_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_users" ADD CONSTRAINT "restaurant_users_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_users" ADD CONSTRAINT "restaurant_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lines" ADD CONSTRAINT "inventory_lines_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "inventory_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lines" ADD CONSTRAINT "inventory_lines_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lines" ADD CONSTRAINT "inventory_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lines" ADD CONSTRAINT "inventory_lines_warehouse_product_id_fkey" FOREIGN KEY ("warehouse_product_id") REFERENCES "warehouse_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_email_logs" ADD CONSTRAINT "subscription_email_logs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_email_logs" ADD CONSTRAINT "subscription_email_logs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_verification_documents" ADD CONSTRAINT "restaurant_verification_documents_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_circuit_sheets" ADD CONSTRAINT "restaurant_circuit_sheets_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_verification_history" ADD CONSTRAINT "restaurant_verification_history_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_products" ADD CONSTRAINT "warehouse_products_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_products" ADD CONSTRAINT "warehouse_products_linked_product_id_fkey" FOREIGN KEY ("linked_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_warehouse_product_id_fkey" FOREIGN KEY ("warehouse_product_id") REFERENCES "warehouse_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_movements" ADD CONSTRAINT "warehouse_movements_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_movements" ADD CONSTRAINT "warehouse_movements_warehouse_product_id_fkey" FOREIGN KEY ("warehouse_product_id") REFERENCES "warehouse_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_to_ops_transfers" ADD CONSTRAINT "warehouse_to_ops_transfers_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_to_ops_transfers" ADD CONSTRAINT "warehouse_to_ops_transfers_warehouse_product_id_fkey" FOREIGN KEY ("warehouse_product_id") REFERENCES "warehouse_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_to_ops_transfers" ADD CONSTRAINT "warehouse_to_ops_transfers_ops_product_id_fkey" FOREIGN KEY ("ops_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_revenues" ADD CONSTRAINT "manual_revenues_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_revenues" ADD CONSTRAINT "manual_revenues_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "cash_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_revenues" ADD CONSTRAINT "manual_revenues_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_revenues" ADD CONSTRAINT "manual_revenues_stock_movement_id_fkey" FOREIGN KEY ("stock_movement_id") REFERENCES "stock_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "cash_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_stock_movement_id_fkey" FOREIGN KEY ("stock_movement_id") REFERENCES "stock_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_singpay_configs" ADD CONSTRAINT "restaurant_singpay_configs_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

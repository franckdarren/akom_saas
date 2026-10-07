-- ============================================================
-- AKÔM SAAS — DÉPLOIEMENT COMPLET SUR UNE BASE SUPABASE VIDE
-- ============================================================
--
-- Fichier unique à exécuter dans le SQL Editor de Supabase sur un
-- projet neuf (0 table, 0 bucket). Il regroupe, dans l'ordre, les
-- 7 scripts de provisioning du dépôt :
--
--   1. supabase/migrations/00000000000000_baseline_schema.sql
--        tables, enums, index, clés étrangères (généré depuis schema.prisma)
--  1b. (ajout de ce fichier, aucune source)
--        DEFAULT gen_random_uuid() sur les 36 clés primaires et
--        DEFAULT now() sur les 25 colonnes updated_at que
--        prisma migrate diff laisse sans valeur par défaut
--   2. scripts/docs/post-restore.sql
--        extensions, RLS (13 tables), realtime, buckets + policies storage
--   3. scripts/supabase-migrations.sql
--        triggers updated_at + RLS tenant sur orders, payments,
--        products, stocks (couvertes nulle part ailleurs)
--   4. scripts/rls-coverage-fix.sql
--        RLS sur les tables restantes
--   5. supabase/migrations/20260507_add_notifications.sql
--        RLS notifications (le reste du fichier est no-op après la phase 1)
--   6. prisma/migrations/restaurant_modules.sql
--        RLS restaurant_modules (le reste du fichier est no-op après la phase 1)
--   7. scripts/init-permissions.sql
--        seed des permissions système + rôles par défaut
--
-- CONTRAINTE D'ORDRE : la phase 2 doit passer AVANT la phase 5, car
-- post-restore.sql exécute un « ALTER PUBLICATION supabase_realtime
-- ADD TABLE notifications » non protégé, alors que la phase 5 l'encadre
-- par un garde EXCEPTION WHEN duplicate_object. Dans l'autre sens,
-- la phase 2 échoue.
--
-- Les phases 2, 3 et 4 se recoupent sur quelques tables (cash_sessions,
-- expenses, manual_revenues, subscriptions, subscription_payments) avec
-- des noms de policy différents. Résultat : deux policies permissives
-- aux prédicats équivalents cohabitent sur ces tables. Redondant mais
-- sans effet sur le résultat des requêtes — les prédicats sont combinés
-- par OR et portent la même condition d'appartenance au tenant.
--
-- Le tout est dans UNE SEULE transaction : en cas d'erreur, rien n'est
-- appliqué et la base reste vide.
--
-- Ne PAS rejouer les autres fichiers de supabase/migrations/ : leur
-- contenu est déjà inclus dans le baseline de la phase 1.
--
-- FICHIER GÉNÉRÉ PAR CONCATÉNATION — ne pas l'éditer à la main.
-- Modifier les 6 sources ci-dessus, puis régénérer. Le baseline de
-- la phase 1 se régénère lui-même avec (lecture seule, ne touche pas
-- à la base) :
--
--   npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma \
--     --script -o supabase/migrations/00000000000000_baseline_schema.sql
--
-- ============================================================

BEGIN;



-- ############################################################
-- PHASE 1 — SCHÉMA DE BASE
-- Source : supabase/migrations/00000000000000_baseline_schema.sql
-- ############################################################

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



-- ############################################################
-- PHASE 1b — VALEURS PAR DÉFAUT — CLÉS PRIMAIRES ET updated_at
-- Source : aucune — ajout propre à ce fichier, voir le commentaire ci-dessous
-- ############################################################

-- Prisma genere certaines valeurs cote client, pas cote base :
--   • `@default(uuid())`  -> l'UUID est produit par le client Prisma
--   • `@updatedAt`        -> l'horodatage est produit par le client Prisma
--
-- `prisma migrate diff` n'emet donc AUCUN DEFAULT pour ces colonnes.
-- Consequence : tout INSERT en SQL brut — le seed de la phase 7, les
-- futures migrations manuelles, un insert depuis le SQL Editor —
-- echoue sur « null value in column "id"/"updated_at" violates
-- not-null constraint ».
--
-- C'est le mode de migration documente de ce projet (SQL brut execute
-- a la main dans Supabase, jamais `prisma migrate`), donc on repose les
-- DEFAULT cote base. Sans effet sur l'application : le client Prisma
-- fournit toujours ces deux valeurs lui-meme, le DEFAULT ne sert
-- qu'aux INSERT SQL bruts.
--
-- Note : `created_at` n'est pas concerne (`@default(now())` produit
-- bien un DEFAULT CURRENT_TIMESTAMP cote base).

-- gen_random_uuid() est natif depuis PostgreSQL 13 ; pgcrypto est
-- recree par la phase 2, cette ligne couvre le cas d'un PG plus ancien.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Cles primaires (36 tables)
-- Les 3 PK absentes de cette liste sont deja pourvues d'un DEFAULT par
-- schema.prisma via @default(dbgenerated("gen_random_uuid()")) :
--   restaurant_circuit_sheets, restaurant_verification_documents,
--   restaurant_verification_history
-- ------------------------------------------------------------

ALTER TABLE cash_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE categories ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE daily_stats ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE expenses ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE families ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE inventory_lines ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE inventory_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE invitations ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE manual_revenues ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE notification_deliveries ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE notification_preferences ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE order_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE payments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE permissions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE restaurant_modules ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE restaurant_singpay_configs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE restaurant_users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE restaurants ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE role_permissions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE roles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE stock_movements ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE stocks ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE subscription_email_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE subscription_payments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE subscriptions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE support_tickets ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE system_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tables ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE ticket_messages ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE warehouse_movements ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE warehouse_products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE warehouse_stock ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE warehouse_to_ops_transfers ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ------------------------------------------------------------
-- Colonnes updated_at (25 tables)
-- ------------------------------------------------------------

ALTER TABLE categories ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE daily_stats ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE expenses ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE families ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE inventory_sessions ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE invitations ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE manual_revenues ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE notification_preferences ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE order_items ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE orders ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE payments ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE products ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE restaurant_circuit_sheets ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE restaurant_singpay_configs ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE restaurant_users ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE restaurant_verification_documents ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE restaurants ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE roles ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE stocks ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE subscription_payments ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE subscriptions ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE support_tickets ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE tables ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE warehouse_products ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE warehouse_stock ALTER COLUMN updated_at SET DEFAULT now();



-- ############################################################
-- PHASE 2 — EXTENSIONS, RLS, REALTIME, STORAGE
-- Source : scripts/docs/post-restore.sql
-- ############################################################

-- ============================================================
-- AKOM — Script de post-restauration Supabase
-- À exécuter dans le SQL Editor de Supabase après chaque
-- `npx prisma db push` ou restauration complète de la base.
--
-- Ce script configure tout ce que Prisma ne gère pas :
--   1. Extensions PostgreSQL
--   2. Row Level Security (activation + policies)
--   3. Supabase Realtime (publication + REPLICA IDENTITY)
--   4. Storage (buckets + policies)
-- ============================================================


-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 2. ROW LEVEL SECURITY — ACTIVATION
-- ============================================================

ALTER TABLE cash_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_revenues            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_singpay_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_movements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock            ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_to_ops_transfers ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. ROW LEVEL SECURITY — POLICIES
-- ============================================================

-- ------------------------------------------------------------
-- cash_sessions
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "cash_sessions_restaurant_isolation" ON cash_sessions;
CREATE POLICY "cash_sessions_restaurant_isolation" ON cash_sessions
  FOR ALL TO public
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- expenses
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "expenses_restaurant_isolation" ON expenses;
CREATE POLICY "expenses_restaurant_isolation" ON expenses
  FOR ALL TO public
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- manual_revenues
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "manual_revenues_restaurant_isolation" ON manual_revenues;
CREATE POLICY "manual_revenues_restaurant_isolation" ON manual_revenues
  FOR ALL TO public
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- permissions
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view all permissions" ON permissions;
CREATE POLICY "Authenticated users can view all permissions" ON permissions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only service role can modify permissions" ON permissions;
CREATE POLICY "Only service role can modify permissions" ON permissions
  FOR ALL TO public
  USING ((auth.jwt() ->> 'role') = 'service_role');

-- ------------------------------------------------------------
-- restaurant_singpay_configs
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "restaurant_singpay_configs_policy" ON restaurant_singpay_configs;
CREATE POLICY "restaurant_singpay_configs_policy" ON restaurant_singpay_configs
  FOR ALL TO public
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- role_permissions
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view role permissions of their restaurants" ON role_permissions;
CREATE POLICY "Users can view role permissions of their restaurants" ON role_permissions
  FOR SELECT TO public
  USING (role_id IN (
    SELECT id FROM roles
    WHERE restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Users can create role permissions in their restaurants" ON role_permissions;
CREATE POLICY "Users can create role permissions in their restaurants" ON role_permissions
  FOR INSERT TO public
  WITH CHECK (role_id IN (
    SELECT id FROM roles
    WHERE restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    ) AND is_system = false
  ));

DROP POLICY IF EXISTS "Users can delete role permissions in their restaurants" ON role_permissions;
CREATE POLICY "Users can delete role permissions in their restaurants" ON role_permissions
  FOR DELETE TO public
  USING (role_id IN (
    SELECT id FROM roles
    WHERE restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    ) AND is_system = false
  ));

-- ------------------------------------------------------------
-- roles
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view roles of their restaurants" ON roles;
CREATE POLICY "Users can view roles of their restaurants" ON roles
  FOR SELECT TO public
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create roles in their restaurants" ON roles;
CREATE POLICY "Users can create roles in their restaurants" ON roles
  FOR INSERT TO public
  WITH CHECK (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update custom roles in their restaurants" ON roles;
CREATE POLICY "Users can update custom roles in their restaurants" ON roles
  FOR UPDATE TO public
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    ) AND is_system = false
  );

DROP POLICY IF EXISTS "Users can delete custom roles in their restaurants" ON roles;
CREATE POLICY "Users can delete custom roles in their restaurants" ON roles
  FOR DELETE TO public
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    ) AND is_system = false
  );

-- ------------------------------------------------------------
-- subscription_payments
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their payments" ON subscription_payments;
CREATE POLICY "Users can view their payments" ON subscription_payments
  FOR SELECT TO authenticated
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "authenticated_select_own_payments" ON subscription_payments;
CREATE POLICY "authenticated_select_own_payments" ON subscription_payments
  FOR SELECT TO authenticated
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role can insert payments" ON subscription_payments;
CREATE POLICY "Service role can insert payments" ON subscription_payments
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update payments" ON subscription_payments;
CREATE POLICY "Service role can update payments" ON subscription_payments
  FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_select_all_payments" ON subscription_payments;
CREATE POLICY "service_role_select_all_payments" ON subscription_payments
  FOR SELECT TO service_role
  USING (true);

DROP POLICY IF EXISTS "service_role_insert_payment" ON subscription_payments;
CREATE POLICY "service_role_insert_payment" ON subscription_payments
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_update_payment" ON subscription_payments;
CREATE POLICY "service_role_update_payment" ON subscription_payments
  FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_delete_payment" ON subscription_payments;
CREATE POLICY "service_role_delete_payment" ON subscription_payments
  FOR DELETE TO service_role
  USING (true);

-- ------------------------------------------------------------
-- subscriptions
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their restaurant subscription" ON subscriptions;
CREATE POLICY "Users can view their restaurant subscription" ON subscriptions
  FOR SELECT TO authenticated
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "authenticated_select_own_subscription" ON subscriptions;
CREATE POLICY "authenticated_select_own_subscription" ON subscriptions
  FOR SELECT TO authenticated
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role can insert subscriptions" ON subscriptions;
CREATE POLICY "Service role can insert subscriptions" ON subscriptions
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update subscriptions" ON subscriptions;
CREATE POLICY "Service role can update subscriptions" ON subscriptions
  FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_select_all_subscriptions" ON subscriptions;
CREATE POLICY "service_role_select_all_subscriptions" ON subscriptions
  FOR SELECT TO service_role
  USING (true);

DROP POLICY IF EXISTS "service_role_insert_subscription" ON subscriptions;
CREATE POLICY "service_role_insert_subscription" ON subscriptions
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_update_subscription" ON subscriptions;
CREATE POLICY "service_role_update_subscription" ON subscriptions
  FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_delete_subscription" ON subscriptions;
CREATE POLICY "service_role_delete_subscription" ON subscriptions
  FOR DELETE TO service_role
  USING (true);

-- ------------------------------------------------------------
-- warehouse_movements
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Restaurant isolation for warehouse_movements" ON warehouse_movements;
CREATE POLICY "Restaurant isolation for warehouse_movements" ON warehouse_movements
  FOR ALL TO public
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- warehouse_products
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Restaurant isolation for warehouse_products" ON warehouse_products;
CREATE POLICY "Restaurant isolation for warehouse_products" ON warehouse_products
  FOR ALL TO public
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- warehouse_stock
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Restaurant isolation for warehouse_stock" ON warehouse_stock;
CREATE POLICY "Restaurant isolation for warehouse_stock" ON warehouse_stock
  FOR ALL TO public
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- warehouse_to_ops_transfers
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Restaurant isolation for warehouse_to_ops_transfers" ON warehouse_to_ops_transfers;
CREATE POLICY "Restaurant isolation for warehouse_to_ops_transfers" ON warehouse_to_ops_transfers
  FOR ALL TO public
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));


-- ============================================================
-- 4. SUPABASE REALTIME
-- ============================================================

-- notifications : cloche temps réel, filtrée par user_id
-- REPLICA IDENTITY FULL obligatoire pour que le filtre user_id=eq.xxx fonctionne
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- orders : KDS et POS temps réel, filtrés par restaurant_id
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;


-- ============================================================
-- 5. STORAGE — BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('circuit-sheets',         'circuit-sheets',         false, NULL,     NULL),
  ('identity-documents',     'identity-documents',     false, NULL,     NULL),
  ('payment-proofs',         'payment-proofs',         true,  NULL,     NULL),
  ('products',               'products',               true,  5242880,  NULL),
  ('restaurant-covers',      'restaurant-covers',      true,  NULL,     NULL),
  ('restaurant-logos',       'restaurant-logos',       true,  NULL,     NULL),
  ('restaurant-profiles',    'restaurant-profiles',    true,  NULL,     NULL),
  ('verification-documents', 'verification-documents', true,  10485760, NULL),
  ('warehouse-products',     'warehouse-products',     true,  5242880,  ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ============================================================
-- 6. STORAGE — POLICIES
-- ============================================================

-- ------------------------------------------------------------
-- restaurant-covers
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public read access"                   ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view covers"               ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete covers" ON storage.objects;

CREATE POLICY "Anyone can view covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-covers');

CREATE POLICY "Authenticated users can upload covers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'restaurant-covers');

CREATE POLICY "Authenticated users can update covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'restaurant-covers');

CREATE POLICY "Authenticated users can delete covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'restaurant-covers');

-- ------------------------------------------------------------
-- restaurant-logos
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view logos"               ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

CREATE POLICY "Anyone can view logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated users can delete logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'restaurant-logos');

-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public access to product images"          ON storage.objects;
DROP POLICY IF EXISTS "Public read access for products"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload products"  ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own products"      ON storage.objects;

CREATE POLICY "Public access to product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload products" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own products" ON storage.objects
  FOR DELETE USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- payment-proofs
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public read access for payment-proofs"            ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs"    ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own payment proofs" ON storage.objects;

CREATE POLICY "Public read access for payment-proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can upload payment proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete own payment proofs" ON storage.objects
  FOR DELETE USING (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- restaurant-profiles
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view restaurant profiles"              ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload restaurant profiles" ON storage.objects;

CREATE POLICY "Public can view restaurant profiles" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-profiles');

CREATE POLICY "Authenticated users can upload restaurant profiles" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'restaurant-profiles' AND auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- verification-documents
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Read verification docs"                         ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Upload verification docs"                       ON storage.objects;
DROP POLICY IF EXISTS "Update verification docs"                       ON storage.objects;

CREATE POLICY "Authenticated users can read verification docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'verification-documents');

CREATE POLICY "Upload verification docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "Update verification docs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'verification-documents');

-- ------------------------------------------------------------
-- circuit-sheets
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Only restaurant admin can upload circuit sheets"       ON storage.objects;
DROP POLICY IF EXISTS "Only restaurant admin can view their circuit sheets"   ON storage.objects;

CREATE POLICY "Only restaurant admin can upload circuit sheets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'circuit-sheets' AND auth.role() = 'authenticated');

CREATE POLICY "Only restaurant admin can view their circuit sheets" ON storage.objects
  FOR SELECT USING (bucket_id = 'circuit-sheets' AND auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- identity-documents
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Only restaurant admin can upload identity docs"     ON storage.objects;
DROP POLICY IF EXISTS "Only restaurant admin can view their identity docs" ON storage.objects;

CREATE POLICY "Only restaurant admin can upload identity docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'identity-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Only restaurant admin can view their identity docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'identity-documents' AND auth.uid() IS NOT NULL);

-- warehouse-products : bucket public, pas de policy spécifique requise



-- ############################################################
-- PHASE 3 — TRIGGERS updated_at + RLS TENANT (orders, payments, products, stocks)
-- Source : scripts/supabase-migrations.sql
-- ############################################################

-- ============================================================
-- MIGRATIONS SUPABASE — Akom SaaS
-- ============================================================
-- Fichier unique à lancer sur Supabase (SQL Editor).
-- Chaque section est idempotente (IF NOT EXISTS / IF EXISTS).
-- Ordre : index → contraintes schéma → timestamps → RLS
-- ============================================================

-- BEGIN;  (retiré : transaction gérée globalement en tête de fichier)

-- ============================================================
-- SECTION 1 : INDEX MANQUANTS (IDX-01 à IDX-07)
-- ============================================================

-- IDX-01 : categories
CREATE INDEX IF NOT EXISTS "categories_restaurant_id_idx"
    ON categories (restaurant_id);

CREATE INDEX IF NOT EXISTS "categories_restaurant_id_is_active_idx"
    ON categories (restaurant_id, is_active);

CREATE INDEX IF NOT EXISTS "categories_restaurant_id_position_idx"
    ON categories (restaurant_id, position);

-- IDX-02 : restaurant_users — restaurantId manquant
CREATE INDEX IF NOT EXISTS "restaurant_users_restaurant_id_idx"
    ON restaurant_users (restaurant_id);

-- IDX-03 : order_items — productId manquant
CREATE INDEX IF NOT EXISTS "order_items_product_id_idx"
    ON order_items (product_id);

-- IDX-04 : payments — index composites manquants
CREATE INDEX IF NOT EXISTS "payments_restaurant_id_status_idx"
    ON payments (restaurant_id, status);

CREATE INDEX IF NOT EXISTS "payments_restaurant_id_created_at_idx"
    ON payments (restaurant_id, created_at DESC);

-- IDX-05 : manual_revenues — revenueDate
CREATE INDEX IF NOT EXISTS "manual_revenues_restaurant_id_revenue_date_idx"
    ON manual_revenues (restaurant_id, revenue_date);

-- IDX-05 : expenses — expenseDate
CREATE INDEX IF NOT EXISTS "expenses_restaurant_id_expense_date_idx"
    ON expenses (restaurant_id, expense_date);

-- IDX-06 : warehouse_movements — remplace l'index seul sur created_at
DROP INDEX IF EXISTS "warehouse_movements_created_at_idx";
CREATE INDEX IF NOT EXISTS "warehouse_movements_restaurant_id_created_at_idx"
    ON warehouse_movements (restaurant_id, created_at DESC);

-- IDX-07 : cash_sessions — status
CREATE INDEX IF NOT EXISTS "cash_sessions_restaurant_id_status_idx"
    ON cash_sessions (restaurant_id, status);

-- ============================================================
-- SECTION 2 : CONTRAINTES SCHÉMA (SCH)
-- ============================================================

-- SCH-01 : order_items — productId SET NULL à la suppression d'un produit
-- (preserve l'historique ; productName est déjà dénormalisé sur la ligne)
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_items_product_id_fkey'
          AND table_name = 'order_items'
    ) THEN
        ALTER TABLE order_items ADD CONSTRAINT "order_items_product_id_fkey"
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
    ELSE
        ALTER TABLE order_items DROP CONSTRAINT "order_items_product_id_fkey";
        ALTER TABLE order_items ADD CONSTRAINT "order_items_product_id_fkey"
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
    END IF;
END $$;

-- SCH-04 : categories — unicité du nom par restaurant
-- ⚠️  Échouera s'il existe déjà des doublons de noms — nettoyer avant si nécessaire
CREATE UNIQUE INDEX IF NOT EXISTS "categories_restaurant_id_name_key"
    ON categories (restaurant_id, name);

-- SCH-05 : warehouse_products — unicité du SKU par restaurant (index partiel, sku IS NOT NULL)
-- Prisma ne supporte pas les index partiels nativement → SQL uniquement
CREATE UNIQUE INDEX IF NOT EXISTS "warehouse_products_restaurant_sku_unique"
    ON warehouse_products (restaurant_id, sku)
    WHERE sku IS NOT NULL;

-- ============================================================
-- SECTION 3 : TIMESTAMPS MANQUANTS (SCH-07 à SCH-10)
-- ============================================================

-- SCH-07 : order_items — createdAt + updatedAt
ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Trigger pour updated_at automatique sur order_items
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'order_items_updated_at'
    ) THEN
        CREATE TRIGGER order_items_updated_at
            BEFORE UPDATE ON order_items
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- SCH-08 : restaurant_users — updatedAt
ALTER TABLE restaurant_users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'restaurant_users_updated_at'
    ) THEN
        CREATE TRIGGER restaurant_users_updated_at
            BEFORE UPDATE ON restaurant_users
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- SCH-09 : stocks — createdAt
ALTER TABLE stocks
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- SCH-10 : manual_revenues — updatedAt
ALTER TABLE manual_revenues
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'manual_revenues_updated_at'
    ) THEN
        CREATE TRIGGER manual_revenues_updated_at
            BEFORE UPDATE ON manual_revenues
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- SCH-10 : expenses — updatedAt
ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'expenses_updated_at'
    ) THEN
        CREATE TRIGGER expenses_updated_at
            BEFORE UPDATE ON expenses
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- ============================================================
-- SECTION 4 : RLS — ISOLATION TENANT (RLS-01)
-- ============================================================
-- Note : ces policies protègent les accès via le dashboard Supabase
-- et psql. Le client Prisma avec service_role les bypasse —
-- la sécurité applicative (getCurrentUserAndRestaurant) reste
-- la ligne principale de défense.

-- orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_orders" ON orders;
CREATE POLICY "tenant_isolation_orders" ON orders
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );

-- payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_payments" ON payments;
CREATE POLICY "tenant_isolation_payments" ON payments
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );

-- products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_products" ON products;
CREATE POLICY "tenant_isolation_products" ON products
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );

-- stocks
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_stocks" ON stocks;
CREATE POLICY "tenant_isolation_stocks" ON stocks
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );

-- cash_sessions
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_cash_sessions" ON cash_sessions;
CREATE POLICY "tenant_isolation_cash_sessions" ON cash_sessions
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );

-- expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_expenses" ON expenses;
CREATE POLICY "tenant_isolation_expenses" ON expenses
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );

-- manual_revenues
ALTER TABLE manual_revenues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_manual_revenues" ON manual_revenues;
CREATE POLICY "tenant_isolation_manual_revenues" ON manual_revenues
    FOR ALL TO authenticated
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );

-- ============================================================
-- SECTION 5 : ABONNEMENTS (repris de policy-abonnement.sql)
-- ============================================================
-- Déjà appliqué si policy-abonnement.sql a été lancé.
-- Idempotent grâce au DROP POLICY IF EXISTS.

GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON subscription_payments TO authenticated;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON subscription_payments TO service_role;

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_own_subscription" ON subscriptions;
DROP POLICY IF EXISTS "service_role_select_all_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "service_role_insert_subscription" ON subscriptions;
DROP POLICY IF EXISTS "service_role_update_subscription" ON subscriptions;
DROP POLICY IF EXISTS "service_role_delete_subscription" ON subscriptions;

CREATE POLICY "authenticated_select_own_subscription" ON subscriptions
    FOR SELECT TO authenticated
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "service_role_select_all_subscriptions" ON subscriptions
    FOR SELECT TO service_role USING (true);
CREATE POLICY "service_role_insert_subscription" ON subscriptions
    FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_role_update_subscription" ON subscriptions
    FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_delete_subscription" ON subscriptions
    FOR DELETE TO service_role USING (true);

DROP POLICY IF EXISTS "authenticated_select_own_payments" ON subscription_payments;
DROP POLICY IF EXISTS "service_role_select_all_payments" ON subscription_payments;
DROP POLICY IF EXISTS "service_role_insert_payment" ON subscription_payments;
DROP POLICY IF EXISTS "service_role_update_payment" ON subscription_payments;
DROP POLICY IF EXISTS "service_role_delete_payment" ON subscription_payments;

CREATE POLICY "authenticated_select_own_payments" ON subscription_payments
    FOR SELECT TO authenticated
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "service_role_select_all_payments" ON subscription_payments
    FOR SELECT TO service_role USING (true);
CREATE POLICY "service_role_insert_payment" ON subscription_payments
    FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_role_update_payment" ON subscription_payments
    FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_delete_payment" ON subscription_payments
    FOR DELETE TO service_role USING (true);

-- COMMIT;  (retiré : transaction gérée globalement en tête de fichier)



-- ############################################################
-- PHASE 4 — RLS — TABLES RESTANTES
-- Source : scripts/rls-coverage-fix.sql
-- ############################################################

-- ============================================================
-- RLS COVERAGE FIX — Akom SaaS
-- ============================================================
-- À LANCER DANS LE SQL EDITOR SUPABASE.
--
-- Contexte :
-- L'audit sécurité a identifié plusieurs tables sensibles sans RLS.
-- Avec les GRANTs par défaut de Supabase sur le schéma `public`, un
-- utilisateur authentifié peut interroger/modifier ces tables
-- directement depuis le client browser @supabase/supabase-js.
--
-- Tables couvertes par ce fix :
--   • Critiques (privilege escalation possible) :
--     - restaurant_users
--     - roles, role_permissions
--     - invitations
--     - restaurant_singpay_configs
--     - restaurant_verification_documents
--     - restaurants
--   • Privacy / vandalisme :
--     - categories, families, tables
--     - order_items
--     - stock_movements
--     - warehouse_products, warehouse_stocks, warehouse_movements,
--       warehouse_to_ops_transfers
--     - restaurant_circuit_sheets, restaurant_verification_history
--     - support_tickets, ticket_messages
--     - system_logs
--
-- Pattern :
--   Toutes les tables liées à `restaurant_id` filtrent via la
--   fonction `auth.uid()` jointe à `restaurant_users`.
--   Les tables liées à `user_id` directement filtrent par auth.uid().
--   `permissions` (table globale) reste lisible par tous les authentifiés.
--   Les mutations (INSERT/UPDATE/DELETE) restent réservées au
--   `service_role` — toute la logique métier passe par Prisma serveur-side.
--
-- Idempotent : utilise DROP POLICY IF EXISTS + CREATE POLICY.
-- ============================================================

-- BEGIN;  (retiré : transaction gérée globalement en tête de fichier)

-- ============================================================
-- HELPER FUNCTION : a_l_acces_au_restaurant(restaurant_id)
-- Retourne true si l'utilisateur courant est membre du restaurant.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_restaurant_member(_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM restaurant_users
        WHERE user_id = auth.uid()
          AND restaurant_id = _restaurant_id
    );
$$;

-- ============================================================
-- restaurants : un user voit les restaurants où il est membre
-- Pas d'INSERT/UPDATE/DELETE pour authenticated → tout passe par
-- les server actions (Prisma + service_role).
-- ============================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurants_select_member" ON restaurants;
CREATE POLICY "restaurants_select_member" ON restaurants
    FOR SELECT TO authenticated
    USING (is_restaurant_member(id));

-- ============================================================
-- restaurant_users : un user voit UNIQUEMENT ses propres memberships.
-- CRITIQUE : sans cette policy, un attaquant pouvait s'INSERT un
-- restaurant_users avec role='admin' pour devenir admin de
-- n'importe quel restaurant.
-- ============================================================

ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurant_users_select_own" ON restaurant_users;
CREATE POLICY "restaurant_users_select_own" ON restaurant_users
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR is_restaurant_member(restaurant_id)
    );

-- ============================================================
-- roles, role_permissions, permissions
-- ============================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_select_member" ON roles;
CREATE POLICY "roles_select_member" ON roles
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_permissions_select_member" ON role_permissions;
CREATE POLICY "role_permissions_select_member" ON role_permissions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = role_permissions.role_id
              AND is_restaurant_member(r.restaurant_id)
        )
    );

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissions_select_authenticated" ON permissions;
CREATE POLICY "permissions_select_authenticated" ON permissions
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================
-- invitations : seuls les membres du restaurant invitant peuvent
-- voir les invitations. Sans ça, n'importe quel user authentifié
-- pouvait lire les tokens en clair de toutes les invitations
-- de la plateforme.
-- ============================================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_select_member" ON invitations;
CREATE POLICY "invitations_select_member" ON invitations
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- restaurant_singpay_configs : wallet_id, merchant_code (privacy)
-- ============================================================

ALTER TABLE restaurant_singpay_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "singpay_config_select_member" ON restaurant_singpay_configs;
CREATE POLICY "singpay_config_select_member" ON restaurant_singpay_configs
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- restaurant_verification_documents : URLs de pièces d'identité
-- ============================================================

ALTER TABLE restaurant_verification_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verif_docs_select_member" ON restaurant_verification_documents;
CREATE POLICY "verif_docs_select_member" ON restaurant_verification_documents
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- restaurant_circuit_sheets, restaurant_verification_history
-- ============================================================

ALTER TABLE restaurant_circuit_sheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "circuit_sheets_select_member" ON restaurant_circuit_sheets;
CREATE POLICY "circuit_sheets_select_member" ON restaurant_circuit_sheets
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE restaurant_verification_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "verif_history_select_member" ON restaurant_verification_history;
CREATE POLICY "verif_history_select_member" ON restaurant_verification_history
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- categories, families, tables
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_member" ON categories;
CREATE POLICY "categories_select_member" ON categories
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "families_select_member" ON families;
CREATE POLICY "families_select_member" ON families
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tables_select_member" ON tables;
CREATE POLICY "tables_select_member" ON tables
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- order_items : isolation via order.restaurantId
-- ============================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_member" ON order_items;
CREATE POLICY "order_items_select_member" ON order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
              AND is_restaurant_member(o.restaurant_id)
        )
    );

-- ============================================================
-- stock_movements
-- ============================================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_select_member" ON stock_movements;
CREATE POLICY "stock_movements_select_member" ON stock_movements
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- warehouse_*
-- ============================================================

ALTER TABLE warehouse_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_products_select_member" ON warehouse_products;
CREATE POLICY "warehouse_products_select_member" ON warehouse_products
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_stocks_select_member" ON warehouse_stock;
CREATE POLICY "warehouse_stocks_select_member" ON warehouse_stock
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE warehouse_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_movements_select_member" ON warehouse_movements;
CREATE POLICY "warehouse_movements_select_member" ON warehouse_movements
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE warehouse_to_ops_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_transfers_select_member" ON warehouse_to_ops_transfers;
CREATE POLICY "warehouse_transfers_select_member" ON warehouse_to_ops_transfers
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- support_tickets, ticket_messages
-- ============================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_tickets_select_member" ON support_tickets;
CREATE POLICY "support_tickets_select_member" ON support_tickets
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticket_messages_select_member" ON ticket_messages;
CREATE POLICY "ticket_messages_select_member" ON ticket_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets t
            WHERE t.id = ticket_messages.ticket_id
              AND is_restaurant_member(t.restaurant_id)
        )
    );

-- ============================================================
-- system_logs : superadmin uniquement (côté serveur via service_role)
-- Aucun authenticated ne doit lire/modifier les logs système.
-- ============================================================

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
-- Aucune policy pour authenticated → tout est bloqué pour eux.
-- Seul service_role (côté serveur via Prisma admin) accède.

-- COMMIT;  (retiré : transaction gérée globalement en tête de fichier)

-- ============================================================
-- VÉRIFICATION POST-APPLICATION
-- Lancer cette requête pour vérifier que toutes les tables
-- sensibles ont bien RLS activée.
-- ============================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY rowsecurity, tablename;



-- ############################################################
-- PHASE 5 — RLS NOTIFICATIONS
-- Source : supabase/migrations/20260507_add_notifications.sql
-- ############################################################

-- Migration : système de notifications (in-app + email)
-- Crée 3 tables : notifications, notification_deliveries, notification_preferences
-- + RLS pour que chaque utilisateur ne voie que ses notifications
-- + Activation Realtime sur notifications

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'support_reply',
    'support_ticket_resolved',
    'verification_approved',
    'verification_rejected',
    'circuit_sheet_deadline',
    'payment_received',
    'payment_failed',
    'subscription_paid',
    'subscription_expiring',
    'subscription_suspended',
    'low_stock_alert',
    'slow_order_alert',
    'new_invitation_accepted',
    'new_support_ticket',
    'new_verification_submitted',
    'new_subscription_payment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLE : notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  type          "NotificationType" NOT NULL,
  priority      "NotificationPriority" NOT NULL DEFAULT 'normal',
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  action_url    TEXT,
  metadata      JSONB,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_restaurant_idx
  ON notifications (restaurant_id);

CREATE INDEX IF NOT EXISTS notifications_type_idx
  ON notifications (type);

-- ============================================================
-- TABLE : notification_deliveries (suivi par canal)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel         "NotificationChannel" NOT NULL,
  status          TEXT NOT NULL,
  recipient       TEXT NOT NULL,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_deliveries_notif_idx
  ON notification_deliveries (notification_id);

CREATE INDEX IF NOT EXISTS notification_deliveries_status_idx
  ON notification_deliveries (status);

-- ============================================================
-- TABLE : notification_preferences (par user × type)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  type       "NotificationType" NOT NULL,
  in_app     BOOLEAN NOT NULL DEFAULT TRUE,
  email      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS notification_preferences_user_idx
  ON notification_preferences (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences   ENABLE ROW LEVEL SECURITY;

-- notifications : un user lit/maj uniquement les siennes
DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT/DELETE réservés au service_role (server-side via Prisma admin)

-- notification_deliveries : lecture si on possède la notification associée
DROP POLICY IF EXISTS notification_deliveries_select_own ON notification_deliveries;
CREATE POLICY notification_deliveries_select_own ON notification_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = notification_deliveries.notification_id
        AND n.user_id = auth.uid()
    )
  );

-- notification_preferences : un user gère ses propres préférences
DROP POLICY IF EXISTS notification_preferences_select_own ON notification_preferences;
CREATE POLICY notification_preferences_select_own ON notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_insert_own ON notification_preferences;
CREATE POLICY notification_preferences_insert_own ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_update_own ON notification_preferences;
CREATE POLICY notification_preferences_update_own ON notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_delete_own ON notification_preferences;
CREATE POLICY notification_preferences_delete_own ON notification_preferences
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- REALTIME : activer le streaming des changements sur notifications
-- ============================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;



-- ############################################################
-- PHASE 6 — RLS RESTAURANT_MODULES
-- Source : prisma/migrations/restaurant_modules.sql
-- ############################################################

-- Migration : table restaurant_modules
-- À exécuter manuellement dans Supabase (SQL Editor)

CREATE TABLE IF NOT EXISTS restaurant_modules (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    module_key      TEXT        NOT NULL,
    is_enabled      BOOLEAN     NOT NULL DEFAULT true,
    enabled_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    enabled_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT restaurant_modules_restaurant_id_module_key_key
        UNIQUE (restaurant_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_modules_restaurant_id
    ON restaurant_modules(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_modules_restaurant_enabled
    ON restaurant_modules(restaurant_id, is_enabled);

-- RLS
ALTER TABLE restaurant_modules ENABLE ROW LEVEL SECURITY;

-- Lecture : membres de la structure
CREATE POLICY "restaurant_modules_select" ON restaurant_modules
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );

-- Écriture : admins uniquement
CREATE POLICY "restaurant_modules_admin_write" ON restaurant_modules
    FOR ALL USING (
        restaurant_id IN (
            SELECT ru.restaurant_id
            FROM restaurant_users ru
            JOIN roles r ON r.id = ru.role_id
            WHERE ru.user_id = auth.uid()
              AND r.slug = 'admin'
        )
    );



-- ############################################################
-- PHASE 7 — SEED PERMISSIONS ET RÔLES
-- Source : scripts/init-permissions.sql (lignes 1-241 ; la suite du fichier est de la documentation Markdown, pas du SQL)
-- ############################################################

-- ============================================================
-- SCRIPT D'INITIALISATION DES PERMISSIONS ET RÔLES
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- Fonction helper pour créer ou récupérer une permission
CREATE OR REPLACE FUNCTION upsert_permission(
    p_resource text,
    p_action text,
    p_name text,
    p_description text,
    p_category text
) RETURNS uuid AS $$
DECLARE
v_permission_id uuid;
BEGIN
INSERT INTO permissions (resource, action, name, description, category, is_system)
VALUES (p_resource::permission_resource, p_action::permission_action, p_name, p_description, p_category, true)
    ON CONFLICT (resource, action) 
    DO UPDATE SET
    name = EXCLUDED.name,
               description = EXCLUDED.description,
               category = EXCLUDED.category
               RETURNING id INTO v_permission_id;

RETURN v_permission_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ÉTAPE 1 : Créer toutes les permissions système
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '🔐 Création des permissions système...';
END $$;

-- Restaurant
SELECT upsert_permission('restaurants', 'read', 'Voir les informations du restaurant', 'Permet de consulter les informations du restaurant', 'Restaurant');
SELECT upsert_permission('restaurants', 'update', 'Modifier le restaurant', 'Permet de modifier les informations du restaurant (nom, adresse, logo)', 'Restaurant');
SELECT upsert_permission('restaurants', 'manage', 'Gérer complètement le restaurant', 'Accès total à la gestion du restaurant', 'Restaurant');

-- Équipe
SELECT upsert_permission('users', 'read', 'Voir les utilisateurs', 'Permet de consulter la liste des employés', 'Équipe');
SELECT upsert_permission('users', 'create', 'Inviter des utilisateurs', 'Permet d''inviter de nouveaux employés', 'Équipe');
SELECT upsert_permission('users', 'update', 'Modifier les utilisateurs', 'Permet de modifier les rôles et informations des employés', 'Équipe');
SELECT upsert_permission('users', 'delete', 'Retirer des utilisateurs', 'Permet de retirer des employés du restaurant', 'Équipe');

-- Menu
SELECT upsert_permission('menu', 'read', 'Consulter le menu', 'Permet de voir les catégories et produits', 'Menu');
SELECT upsert_permission('categories', 'create', 'Créer des catégories', 'Permet de créer de nouvelles catégories de produits', 'Menu');
SELECT upsert_permission('categories', 'update', 'Modifier des catégories', 'Permet de modifier les catégories existantes', 'Menu');
SELECT upsert_permission('categories', 'delete', 'Supprimer des catégories', 'Permet de supprimer des catégories', 'Menu');
SELECT upsert_permission('products', 'create', 'Créer des produits', 'Permet d''ajouter de nouveaux produits au menu', 'Menu');
SELECT upsert_permission('products', 'update', 'Modifier des produits', 'Permet de modifier les produits (prix, description, disponibilité)', 'Menu');
SELECT upsert_permission('products', 'delete', 'Supprimer des produits', 'Permet de supprimer des produits du menu', 'Menu');

-- Tables
SELECT upsert_permission('tables', 'read', 'Voir les tables', 'Permet de consulter la liste des tables et leurs QR codes', 'Tables');
SELECT upsert_permission('tables', 'create', 'Créer des tables', 'Permet d''ajouter de nouvelles tables', 'Tables');
SELECT upsert_permission('tables', 'update', 'Modifier des tables', 'Permet de modifier les tables (activer/désactiver)', 'Tables');
SELECT upsert_permission('tables', 'delete', 'Supprimer des tables', 'Permet de supprimer des tables', 'Tables');

-- Commandes
SELECT upsert_permission('orders', 'read', 'Voir les commandes', 'Permet de consulter les commandes', 'Commandes');
SELECT upsert_permission('orders', 'update', 'Gérer les commandes', 'Permet de changer le statut des commandes (préparer, servir)', 'Commandes');
SELECT upsert_permission('orders', 'delete', 'Annuler des commandes', 'Permet d''annuler des commandes', 'Commandes');

-- Stocks
SELECT upsert_permission('stocks', 'read', 'Consulter les stocks', 'Permet de voir les quantités en stock', 'Stocks');
SELECT upsert_permission('stocks', 'update', 'Ajuster les stocks', 'Permet de modifier les quantités en stock', 'Stocks');
SELECT upsert_permission('stocks', 'manage', 'Gérer complètement les stocks', 'Accès total à la gestion des stocks', 'Stocks');

-- Paiements
SELECT upsert_permission('payments', 'read', 'Consulter les paiements', 'Permet de voir l''historique des paiements', 'Paiements');
SELECT upsert_permission('payments', 'manage', 'Gérer les paiements', 'Accès total aux paiements et remboursements', 'Paiements');

-- Statistiques
SELECT upsert_permission('stats', 'read', 'Voir les statistiques', 'Permet de consulter les statistiques et rapports', 'Statistiques');

-- Rôles
SELECT upsert_permission('roles', 'read', 'Voir les rôles', 'Permet de consulter les rôles existants', 'Rôles');
SELECT upsert_permission('roles', 'create', 'Créer des rôles', 'Permet de créer de nouveaux rôles personnalisés', 'Rôles');
SELECT upsert_permission('roles', 'update', 'Modifier des rôles', 'Permet de modifier les permissions des rôles personnalisés', 'Rôles');
SELECT upsert_permission('roles', 'delete', 'Supprimer des rôles', 'Permet de supprimer des rôles personnalisés', 'Rôles');

DO $$
DECLARE
v_permission_count integer;
BEGIN
SELECT COUNT(*) INTO v_permission_count FROM permissions;
RAISE NOTICE '✅ % permissions créées', v_permission_count;
END $$;

-- ============================================================
-- ÉTAPE 2 : Créer les rôles système pour chaque restaurant
-- ============================================================

DO $$
DECLARE
v_restaurant RECORD;
    v_admin_role_id uuid;
    v_kitchen_role_id uuid;
    v_cashier_role_id uuid;
    v_permission RECORD;
    v_admin_perms_count integer := 0;
    v_kitchen_perms_count integer := 0;
    v_users_count integer := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '👥 Création des rôles pour chaque restaurant...';
    
    -- Parcourir tous les restaurants
FOR v_restaurant IN SELECT * FROM restaurants LOOP
    RAISE NOTICE '';
RAISE NOTICE '📍 Configuration du restaurant: %', v_restaurant.name;
        
        -- Créer le rôle Administrateur
INSERT INTO roles (restaurant_id, name, description, is_system, is_active)
VALUES (
           v_restaurant.id,
           'Administrateur',
           'Accès complet à toutes les fonctionnalités du restaurant',
           true,
           true
       )
    ON CONFLICT (restaurant_id, name)
        DO UPDATE SET description = EXCLUDED.description
                   RETURNING id INTO v_admin_role_id;

-- Associer TOUTES les permissions au rôle Admin
v_admin_perms_count := 0;
FOR v_permission IN SELECT * FROM permissions LOOP
    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES (v_admin_role_id, v_permission.id)
                    ON CONFLICT (role_id, permission_id) DO NOTHING;
v_admin_perms_count := v_admin_perms_count + 1;
END LOOP;
        
        -- Créer le rôle Cuisine
INSERT INTO roles (restaurant_id, name, description, is_system, is_active)
VALUES (
           v_restaurant.id,
           'Cuisine',
           'Accès à la gestion des commandes en cuisine',
           true,
           true
       )
    ON CONFLICT (restaurant_id, name)
        DO UPDATE SET description = EXCLUDED.description
                   RETURNING id INTO v_kitchen_role_id;

-- Associer les permissions spécifiques au rôle Cuisine
v_kitchen_perms_count := 0;
FOR v_permission IN
SELECT * FROM permissions
WHERE
   -- Voir et gérer les commandes
    (resource = 'orders' AND action IN ('read', 'update'))
   -- Voir le menu
   OR (resource = 'menu' AND action = 'read')
   -- Voir les tables
   OR (resource = 'tables' AND action = 'read')
    LOOP
INSERT INTO role_permissions (role_id, permission_id)
VALUES (v_kitchen_role_id, v_permission.id)
ON CONFLICT (role_id, permission_id) DO NOTHING;
v_kitchen_perms_count := v_kitchen_perms_count + 1;
END LOOP;

        -- Rôle Caissière : créer et voir commandes + paiements
INSERT INTO roles (restaurant_id, name, description, is_system, is_active)
VALUES (v_restaurant.id, 'Caissière', 'Prise de commande et encaissement au comptoir', true, true)
    ON CONFLICT (restaurant_id, name)
        DO UPDATE SET description = EXCLUDED.description
                   RETURNING id INTO v_cashier_role_id;

-- Permissions caissière
INSERT INTO role_permissions (role_id, permission_id)
SELECT v_cashier_role_id, id FROM permissions
WHERE (resource = 'orders' AND action IN ('create', 'read', 'update'))
   OR (resource = 'payments' AND action IN ('create', 'read'))
   OR (resource = 'products' AND action = 'read')
   OR (resource = 'categories' AND action = 'read')
   OR (resource = 'tables' AND action = 'read')
    ON CONFLICT DO NOTHING;

-- Migrer les utilisateurs existants vers le nouveau système
v_users_count := 0;
UPDATE restaurant_users
SET role_id = CASE
                  WHEN role = 'admin' THEN v_admin_role_id
                  WHEN role = 'kitchen' THEN v_kitchen_role_id
                  ELSE v_kitchen_role_id  -- Par défaut, kitchen
    END
WHERE restaurant_id = v_restaurant.id
  AND role_id IS NULL;  -- Ne migrer que ceux qui n'ont pas encore de roleId

GET DIAGNOSTICS v_users_count = ROW_COUNT;

RAISE NOTICE '  ✅ Rôle Admin créé avec % permissions', v_admin_perms_count;
        RAISE NOTICE '  ✅ Rôle Cuisine créé avec % permissions', v_kitchen_perms_count;
        RAISE NOTICE '  ✅ % utilisateur(s) migré(s)', v_users_count;
END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Initialisation terminée avec succès!';
END $$;

-- ============================================================
-- ÉTAPE 3 : Nettoyage - Supprimer la fonction helper
-- ============================================================

DROP FUNCTION IF EXISTS upsert_permission(text, text, text, text, text);

-- ============================================================
-- ÉTAPE 4 : Vérification finale
-- ============================================================

DO $$
DECLARE
v_permissions_count integer;
    v_roles_count integer;
    v_role_permissions_count integer;
    v_restaurants_count integer;
BEGIN
SELECT COUNT(*) INTO v_permissions_count FROM permissions;
SELECT COUNT(*) INTO v_roles_count FROM roles WHERE is_system = true;
SELECT COUNT(*) INTO v_role_permissions_count FROM role_permissions;
SELECT COUNT(*) INTO v_restaurants_count FROM restaurants;

RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RÉSUMÉ DE L''INITIALISATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ % permissions système créées', v_permissions_count;
    RAISE NOTICE '✅ % rôles système créés (% restaurants × 2)', v_roles_count, v_restaurants_count;
    RAISE NOTICE '✅ % associations rôle-permission créées', v_role_permissions_count;
    RAISE NOTICE '========================================';
END $$;


COMMIT;


-- ============================================================
-- RESTE À FAIRE — NON COUVERT PAR CE FICHIER
-- ============================================================
--
-- RLS absente sur 4 tables — aucun script du dépôt ne les couvre :
--   daily_stats, inventory_sessions, inventory_lines, subscription_email_logs
--
-- Avec les GRANT par défaut de Supabase sur le schéma public, un
-- utilisateur authentifié peut les interroger via la clé anon depuis
-- le navigateur : fuite inter-tenant sur le chiffre d'affaires
-- (daily_stats) et sur les sessions d'inventaire.
--
-- Hors SQL :
--   • Auth > URL Configuration — Site URL + Redirect URLs doivent
--     inclure {NEXT_PUBLIC_APP_URL}/api/auth/callback
--   • Variables d'environnement absentes de .env — NEXT_PUBLIC_APP_URL,
--     SUPER_ADMIN_EMAILS, CRON_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL
--   • Secrets GitHub Actions — APP_URL, CRON_SECRET
-- ============================================================

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

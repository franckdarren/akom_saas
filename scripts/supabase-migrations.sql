-- ============================================================
-- MIGRATIONS SUPABASE — Akom SaaS
-- ============================================================
-- Fichier unique à lancer sur Supabase (SQL Editor).
-- Chaque section est idempotente (IF NOT EXISTS / IF EXISTS).
-- Ordre : index → contraintes schéma → timestamps → RLS
-- ============================================================

BEGIN;

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

COMMIT;

-- ============================================================
-- CONFIGURATION COMPLÈTE : PERMISSIONS + RLS
-- ============================================================
BEGIN;
-- Étape 1 : Accorder les permissions de base
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON subscription_payments TO authenticated;
-- Toutes les opérations d'écriture restent réservées au service_role
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON subscription_payments TO service_role;
-- Étape 2 : Activer le RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
-- Étape 3 : Supprimer toutes les anciennes policies
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'subscriptions'
) LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON subscriptions';
END LOOP;
FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'subscription_payments'
) LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON subscription_payments';
END LOOP;
END $$;
-- Étape 4 : Créer les policies RLS correctes pour SUBSCRIPTIONS
-- Policy SELECT : Les utilisateurs peuvent voir leur propre abonnement
CREATE POLICY "authenticated_select_own_subscription" ON subscriptions FOR
SELECT TO authenticated USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- Policy SELECT : service_role peut tout voir
CREATE POLICY "service_role_select_all_subscriptions" ON subscriptions FOR
SELECT TO service_role USING (true);
-- Policy INSERT : Seul service_role peut créer
CREATE POLICY "service_role_insert_subscription" ON subscriptions FOR
INSERT TO service_role WITH CHECK (true);
-- Policy UPDATE : Seul service_role peut modifier
CREATE POLICY "service_role_update_subscription" ON subscriptions FOR
UPDATE TO service_role USING (true) WITH CHECK (true);
-- Policy DELETE : Seul service_role peut supprimer
CREATE POLICY "service_role_delete_subscription" ON subscriptions FOR DELETE TO service_role USING (true);
-- Étape 5 : Créer les policies RLS pour SUBSCRIPTION_PAYMENTS
CREATE POLICY "authenticated_select_own_payments" ON subscription_payments FOR
SELECT TO authenticated USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "service_role_select_all_payments" ON subscription_payments FOR
SELECT TO service_role USING (true);
CREATE POLICY "service_role_insert_payment" ON subscription_payments FOR
INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_role_update_payment" ON subscription_payments FOR
UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_delete_payment" ON subscription_payments FOR DELETE TO service_role USING (true);
COMMIT;
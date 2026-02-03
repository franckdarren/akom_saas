-- ============================================================
-- ACTIVER RLS SUR LES NOUVELLES TABLES
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
-- ============================================================
-- POLICIES - SUBSCRIPTIONS
-- ============================================================
-- Les utilisateurs peuvent voir leur propre abonnement
CREATE POLICY "Users can view their subscription" ON subscriptions FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- Les utilisateurs peuvent mettre à jour leur abonnement (changement de plan)
CREATE POLICY "Users can update their subscription" ON subscriptions FOR
UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- Les abonnements sont créés automatiquement (via service_role)
-- Pas de policy INSERT pour les utilisateurs normaux
-- ============================================================
-- POLICIES - SUBSCRIPTION_PAYMENTS
-- ============================================================
-- Les utilisateurs peuvent voir leurs paiements
CREATE POLICY "Users can view their payments" ON subscription_payments FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- Les utilisateurs peuvent créer des paiements (demandes)
CREATE POLICY "Users can create payments" ON subscription_payments FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- Les utilisateurs peuvent mettre à jour leurs paiements (ajouter preuve)
CREATE POLICY "Users can update their payments" ON subscription_payments FOR
UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
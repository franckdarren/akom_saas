-- Créer la table subscription_email_logs
CREATE TABLE IF NOT EXISTS subscription_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL,
    error_message TEXT NULL
);
-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_subscription_email_logs_subscription_type ON subscription_email_logs(subscription_id, email_type);
CREATE INDEX IF NOT EXISTS idx_subscription_email_logs_restaurant_sent ON subscription_email_logs(restaurant_id, sent_at);
-- Activer RLS
ALTER TABLE subscription_email_logs ENABLE ROW LEVEL SECURITY;
-- Policy : Les utilisateurs peuvent voir les logs de leurs restaurants
CREATE POLICY "Users can view their email logs" ON subscription_email_logs FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- Pas de policy INSERT/UPDATE/DELETE pour les utilisateurs normaux
-- Ces opérations sont gérées uniquement par les Cron Jobs côté serveur
-- ============================================================
-- AKÔM - Migration : Système d'Abonnements
-- Exécuter dans Supabase → SQL Editor → New Query
-- Compatible avec le schema Prisma fourni
-- ============================================================
-- IMPORTANT : Exécuter d'après en bas, bloc par bloc si tu
-- préfères vérifier entre chaque étape. Sinon, tout sélectionner
-- et "Run" d'un coup — l'ordre est déjà correct.
-- ============================================================
-- ============================================================
-- PARTIE 1 : CRÉATION DES TYPES (ENUMS)
-- Prisma mappe ses enums vers des types PostgreSQL custom.
-- Les noms doivent correspondre exactement aux @@map() du schema.
-- ============================================================
CREATE TYPE subscription_plan AS ENUM ('starter', 'business', 'premium');
CREATE TYPE subscription_status AS ENUM (
    'trial',
    'active',
    'expired',
    'suspended',
    'cancelled'
);
CREATE TYPE subscription_payment_method AS ENUM ('manual', 'mobile_money', 'card');
CREATE TYPE subscription_payment_status AS ENUM (
    'pending',
    'confirmed',
    'failed',
    'refunded'
);
-- ============================================================
-- PARTIE 2 : CRÉATION DES TABLES
-- Les colonnes, types et contraintes sont alignés sur le
-- schema.prisma exactement (noms, @map, @db.Uuid, defaults).
-- ============================================================
-- Table : subscriptions
-- Relation 1-to-1 avec restaurants (restaurant_id est UNIQUE)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
    plan subscription_plan NOT NULL,
    status subscription_status NOT NULL DEFAULT 'trial',
    -- Dates de l'essai gratuit
    trial_starts_at TIMESTAMPTZ NOT NULL,
    trial_ends_at TIMESTAMPTZ NOT NULL,
    -- Dates de la période de facturation (nullables car pas de paiement pendant l'essai)
    current_period_start TIMESTAMPTZ NULL,
    current_period_end TIMESTAMPTZ NULL,
    -- Informations du plan et limites
    monthly_price INTEGER NOT NULL,
    -- Prix en FCFA
    billing_cycle INTEGER NOT NULL DEFAULT 1,
    -- 1, 3, 6 ou 12 mois
    max_tables INTEGER NULL,
    -- NULL = illimité (Premium)
    max_users INTEGER NOT NULL,
    has_stock_management BOOLEAN NOT NULL DEFAULT FALSE,
    has_advanced_stats BOOLEAN NOT NULL DEFAULT FALSE,
    has_data_export BOOLEAN NOT NULL DEFAULT FALSE,
    has_mobile_payment BOOLEAN NOT NULL DEFAULT FALSE,
    has_multi_restaurants BOOLEAN NOT NULL DEFAULT FALSE,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Table : subscription_payments
-- Chaque tentative de paiement est une ligne séparée.
-- Un même abonnement peut avoir plusieurs paiements (historique).
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    -- Montant en FCFA
    method subscription_payment_method NOT NULL,
    status subscription_payment_status NOT NULL DEFAULT 'pending',
    billing_cycle INTEGER NOT NULL,
    -- Nombre de mois payés
    -- Champs pour paiement Manuel (MVP)
    proof_url TEXT NULL,
    -- URL Supabase Storage de la preuve
    manual_notes TEXT NULL,
    -- Notes laissées par l'utilisateur
    validated_by UUID NULL,
    -- ID du SuperAdmin qui a validé
    validated_at TIMESTAMPTZ NULL,
    -- Champs pour paiement Mobile Money (V2 — pour l'instant NULL)
    transaction_id TEXT NULL,
    phone_number TEXT NULL,
    provider TEXT NULL,
    -- "airtel" ou "moov"
    -- Dates
    paid_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    -- Fin de la période payée
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ============================================================
-- PARTIE 3 : INDEX
-- Mêmes index que ceux définis par @@index() dans le schema Prisma.
-- Ils accélèrent les requêtes les plus fréquentes (filtres par
-- status, restaurant_id, subscription_id).
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant_status ON subscriptions(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period_end ON subscriptions(status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_restaurant_status ON subscription_payments(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status_created ON subscription_payments(status, created_at);
-- ============================================================
-- PARTIE 4 : TRIGGER updated_at
-- Réutilise la fonction update_updated_at() qui existe déjà
-- dans ton setup (celle utilisée pour restaurants, orders, etc.)
-- Elle met à jour automatiquement le champ updated_at à chaque
-- modification de ligne.
-- ============================================================
-- On crée le trigger sur subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE
UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- On crée le trigger sur subscription_payments
DROP TRIGGER IF EXISTS update_subscription_payments_updated_at ON subscription_payments;
CREATE TRIGGER update_subscription_payments_updated_at BEFORE
UPDATE ON subscription_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ============================================================
-- PARTIE 5 : ROW LEVEL SECURITY (RLS)
-- Même philosophie que le reste de l'app :
--   • Les utilisateurs ne voient que LEUR restaurant.
--   • Les insertions/mises à jour sont vérifiées via restaurant_users.
--   • Le SuperAdmin (service_role) bypass tout via le backend.
-- ============================================================
-- Activer RLS sur les deux tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
-- ------------------------------------------------------------
-- Policies sur : subscriptions
-- ------------------------------------------------------------
-- SELECT : un utilisateur ne voit que l'abonnement de ses restaurants
DROP POLICY IF EXISTS "Users can view their subscription" ON subscriptions;
CREATE POLICY "Users can view their subscription" ON subscriptions FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- UPDATE : même logique pour la modification
DROP POLICY IF EXISTS "Users can update their subscription" ON subscriptions;
CREATE POLICY "Users can update their subscription" ON subscriptions FOR
UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- INSERT : interdit aux utilisateurs normaux via le client.
-- La création se fait uniquement côté serveur (service_role)
-- à l'occasion de createTrialSubscription().
-- Pas de policy INSERT nécessaire ici.
-- ------------------------------------------------------------
-- Policies sur : subscription_payments
-- ------------------------------------------------------------
-- SELECT : voir ses propres paiements
DROP POLICY IF EXISTS "Users can view their subscription payments" ON subscription_payments;
CREATE POLICY "Users can view their subscription payments" ON subscription_payments FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- INSERT : créer un paiement (soumission du formulaire)
DROP POLICY IF EXISTS "Users can create subscription payments" ON subscription_payments;
CREATE POLICY "Users can create subscription payments" ON subscription_payments FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- UPDATE : mettre à jour un paiement (ex: ajouter la preuve après upload)
DROP POLICY IF EXISTS "Users can update their subscription payments" ON subscription_payments;
CREATE POLICY "Users can update their subscription payments" ON subscription_payments FOR
UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- DELETE : interdit aux utilisateurs. Un paiement ne s'efface jamais,
-- même s'il est refusé (audit trail). Géré manuellement si besoin.
-- ============================================================
-- PARTIE 6 : STORAGE — Bucket pour les preuves de paiement
-- Crée le bucket "payment-proofs" s'il n'existe pas déjà.
-- Les policies permettent :
--   • Upload par tout utilisateur authentifié
--   • Lecture publique (pour que le SuperAdmin puisse voir)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT (id) DO NOTHING;
-- Policy : lecture publique du bucket
DROP POLICY IF EXISTS "Public read access for payment-proofs" ON storage.objects;
CREATE POLICY "Public read access for payment-proofs" ON storage.objects FOR
SELECT USING (bucket_id = 'payment-proofs');
-- Policy : upload par utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment proofs" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'payment-proofs'
        AND auth.role() = 'authenticated'
    );
-- Policy : suppression par utilisateur authentifié (en cas d'erreur d'upload)
DROP POLICY IF EXISTS "Authenticated users can delete own payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can delete own payment proofs" ON storage.objects FOR DELETE USING (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
);
-- ============================================================
-- PARTIE 7 : VÉRIFICATION FINALE
-- Ce bloc lance à la fin et affiche un résumé dans les logs
-- pour confirmer que tout a bien été créé.
-- ============================================================
DO $$
DECLARE v_tables INTEGER;
v_indexes INTEGER;
v_policies INTEGER;
v_triggers INTEGER;
v_types INTEGER;
BEGIN -- Compter les tables créées par cette migration
SELECT COUNT(*) INTO v_tables
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('subscriptions', 'subscription_payments');
-- Compter les index créés
SELECT COUNT(*) INTO v_indexes
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_subscription%';
-- Compter les policies RLS sur nos tables
SELECT COUNT(*) INTO v_policies
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('subscriptions', 'subscription_payments');
-- Compter les triggers sur nos tables
SELECT COUNT(*) INTO v_triggers
FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN ('subscriptions', 'subscription_payments');
-- Compter les types créés
SELECT COUNT(*) INTO v_types
FROM pg_type
WHERE typname IN (
        'subscription_plan',
        'subscription_status',
        'subscription_payment_method',
        'subscription_payment_status'
    );
RAISE NOTICE '============================================';
RAISE NOTICE '  Migration Abonnements — Résultat';
RAISE NOTICE '============================================';
RAISE NOTICE '  Types (enums)  : % / 4',
v_types;
RAISE NOTICE '  Tables         : % / 2',
v_tables;
RAISE NOTICE '  Index          : % / 5',
v_indexes;
RAISE NOTICE '  Policies RLS   : % / 5',
v_policies;
RAISE NOTICE '  Triggers       : % / 2',
v_triggers;
RAISE NOTICE '============================================';
-- Alertes si quelque chose manque
IF v_types < 4 THEN RAISE WARNING '⚠️  Types manquants : % / 4',
v_types;
END IF;
IF v_tables < 2 THEN RAISE WARNING '⚠️  Tables manquantes : % / 2',
v_tables;
END IF;
IF v_policies < 5 THEN RAISE WARNING '⚠️  Policies manquantes : % / 5',
v_policies;
END IF;
IF v_types = 4
AND v_tables = 2
AND v_indexes = 5
AND v_policies = 5
AND v_triggers = 2 THEN RAISE NOTICE '  ✅ Tout est en ordre !';
ELSE RAISE WARNING '  ⚠️  Vérifie les alertes ci-dessus.';
END IF;
RAISE NOTICE '============================================';
END $$;


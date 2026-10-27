-- ============================================================
-- Monnaie due aux clients (penurie de petite monnaie)
-- ============================================================
-- Enregistre la monnaie qu'un commerce n'a pas pu rendre a un client.
-- Ce n'est ni une recette ni une depense : c'est de l'argent detenu dans le
-- tiroir qui appartient au client, jusqu'a ce qu'il soit rendu en especes ou
-- deduit d'un achat ulterieur.
--
-- Volontairement sans FK vers cash_sessions : une vente au comptoir peut avoir
-- lieu sans qu'aucune session de caisse ne soit ouverte. L'agregation caisse se
-- fait par date (due_date / settled_date), comme pour les paiements Akom.
--
-- Ajoute aussi payments.amount_tendered / payments.change_returned : le montant
-- physiquement remis par le client et la monnaie effectivement rendue, qui
-- n'etaient tracees nulle part.
--
-- Tous les montants sont en FCFA (entier, sans decimales).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enums
-- ------------------------------------------------------------

DO $$
BEGIN
    CREATE TYPE "change_due_status" AS ENUM ('outstanding', 'settled', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
    CREATE TYPE "change_due_settlement_method" AS ENUM ('cash', 'order_deduction');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-- ------------------------------------------------------------
-- 2. Table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "change_dues" (
    "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id"     UUID NOT NULL,

    "code"              TEXT NOT NULL,
    "amount"            INTEGER NOT NULL,
    "status"            "change_due_status" NOT NULL DEFAULT 'outstanding',

    "customer_name"     TEXT,
    "customer_phone"    TEXT,

    "order_id"          UUID,
    "payment_id"        UUID,

    "due_date"          DATE NOT NULL,

    "settlement_method" "change_due_settlement_method",
    "settled_order_id"  UUID,
    "settled_date"      DATE,
    "settled_at"        TIMESTAMP(3),
    "settled_by"        UUID,

    "cancel_reason"     TEXT,

    "notes"             TEXT,
    "created_by"        UUID NOT NULL,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "change_dues_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "change_dues" IS
    'Monnaie non rendue a un client, faute de petite monnaie. Passif : argent detenu dans le tiroir qui appartient au client.';
COMMENT ON COLUMN "change_dues"."code" IS
    'Code de retrait remis au client sur son ticket. Unique par structure.';
COMMENT ON COLUMN "change_dues"."amount" IS
    'Montant du au client en FCFA (entier, strictement positif).';
COMMENT ON COLUMN "change_dues"."due_date" IS
    'Date metier de creation. Base de l''agregation caisse du jour.';
COMMENT ON COLUMN "change_dues"."settled_date" IS
    'Date metier du reglement. Base de l''agregation caisse du jour du reglement.';
COMMENT ON COLUMN "change_dues"."customer_phone" IS
    'Telephone du client en texte libre : il n''existe pas de modele Client dans Akom.';

-- ------------------------------------------------------------
-- 3. Cles etrangeres
-- ------------------------------------------------------------

ALTER TABLE "change_dues"
    DROP CONSTRAINT IF EXISTS "change_dues_restaurant_id_fkey";
ALTER TABLE "change_dues"
    ADD CONSTRAINT "change_dues_restaurant_id_fkey"
        FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "change_dues"
    DROP CONSTRAINT IF EXISTS "change_dues_order_id_fkey";
ALTER TABLE "change_dues"
    ADD CONSTRAINT "change_dues_order_id_fkey"
        FOREIGN KEY ("order_id") REFERENCES "orders" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "change_dues"
    DROP CONSTRAINT IF EXISTS "change_dues_payment_id_fkey";
ALTER TABLE "change_dues"
    ADD CONSTRAINT "change_dues_payment_id_fkey"
        FOREIGN KEY ("payment_id") REFERENCES "payments" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "change_dues"
    DROP CONSTRAINT IF EXISTS "change_dues_settled_order_id_fkey";
ALTER TABLE "change_dues"
    ADD CONSTRAINT "change_dues_settled_order_id_fkey"
        FOREIGN KEY ("settled_order_id") REFERENCES "orders" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- 4. Contraintes de coherence
-- ------------------------------------------------------------

-- Une dette de 0 FCFA (ou negative) n'a aucun sens metier.
ALTER TABLE "change_dues"
    DROP CONSTRAINT IF EXISTS "change_dues_amount_positive";
ALTER TABLE "change_dues"
    ADD CONSTRAINT "change_dues_amount_positive"
        CHECK ("amount" > 0);

-- Coherence du statut : empeche une dette soldee sans mode de reglement, une
-- annulation sans motif, ou une dette en cours portant des champs de reglement.
ALTER TABLE "change_dues"
    DROP CONSTRAINT IF EXISTS "change_dues_status_coherence";
ALTER TABLE "change_dues"
    ADD CONSTRAINT "change_dues_status_coherence"
        CHECK (
            CASE "status"
                WHEN 'settled' THEN
                    "settlement_method" IS NOT NULL
                    AND "settled_date" IS NOT NULL
                    AND "cancel_reason" IS NULL
                WHEN 'cancelled' THEN
                    "cancel_reason" IS NOT NULL
                    AND "settlement_method" IS NULL
                    AND "settled_date" IS NULL
                ELSE
                    "settlement_method" IS NULL
                    AND "settled_date" IS NULL
                    AND "settled_order_id" IS NULL
                    AND "cancel_reason" IS NULL
            END
        );

-- ------------------------------------------------------------
-- 5. Index
-- ------------------------------------------------------------

-- Le code de retrait doit etre unique par structure, pas globalement.
CREATE UNIQUE INDEX IF NOT EXISTS "change_dues_restaurant_id_code_key"
    ON "change_dues" ("restaurant_id", "code");

CREATE INDEX IF NOT EXISTS "change_dues_restaurant_id_status_idx"
    ON "change_dues" ("restaurant_id", "status");

CREATE INDEX IF NOT EXISTS "change_dues_restaurant_id_due_date_idx"
    ON "change_dues" ("restaurant_id", "due_date");

CREATE INDEX IF NOT EXISTS "change_dues_restaurant_id_settled_date_idx"
    ON "change_dues" ("restaurant_id", "settled_date");

CREATE INDEX IF NOT EXISTS "change_dues_customer_phone_idx"
    ON "change_dues" ("customer_phone");

-- ------------------------------------------------------------
-- 6. Tracabilite de l'encaissement sur payments
-- ------------------------------------------------------------

ALTER TABLE "payments"
    ADD COLUMN IF NOT EXISTS "amount_tendered" INTEGER,
    ADD COLUMN IF NOT EXISTS "change_returned" INTEGER;

COMMENT ON COLUMN "payments"."amount_tendered" IS
    'Especes uniquement : montant physiquement remis par le client (FCFA). NULL pour les autres modes.';
COMMENT ON COLUMN "payments"."change_returned" IS
    'Especes uniquement : monnaie effectivement rendue au client (FCFA). Le solde non rendu est materialise par une ligne change_dues.';

ALTER TABLE "payments"
    DROP CONSTRAINT IF EXISTS "payments_tender_positive";
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_tender_positive"
        CHECK (
            ("amount_tendered" IS NULL OR "amount_tendered" >= 0)
            AND ("change_returned" IS NULL OR "change_returned" >= 0)
        );

-- ------------------------------------------------------------
-- 7. Row Level Security
-- ------------------------------------------------------------

ALTER TABLE "change_dues" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "change_dues_restaurant_isolation" ON "change_dues";
CREATE POLICY "change_dues_restaurant_isolation"
    ON "change_dues"
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );

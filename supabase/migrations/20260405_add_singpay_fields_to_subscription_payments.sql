-- Ajouter les champs SINGPAY sur subscription_payments pour le paiement mobile money des abonnements

ALTER TABLE "public"."subscription_payments"
  ADD COLUMN "singpay_reference" TEXT,
  ADD COLUMN "singpay_transaction_id" TEXT,
  ADD COLUMN "callback_received" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "callback_data" JSONB,
  ADD COLUMN "callback_at" TIMESTAMPTZ;

-- Contrainte unique sur singpay_reference (pour recherche par référence dans les webhooks)
ALTER TABLE "public"."subscription_payments"
  ADD CONSTRAINT "subscription_payments_singpay_reference_key" UNIQUE ("singpay_reference");

-- Index pour la recherche par singpay_reference
CREATE INDEX "subscription_payments_singpay_reference_idx"
  ON "public"."subscription_payments" ("singpay_reference");

-- Plan demandé lors d'un paiement manuel.
-- Auparavant le plan de l'abonnement était modifié dès la soumission du paiement,
-- avant validation par le superadmin : les fonctionnalités du plan supérieur étaient
-- débloquées sans paiement. Le plan est désormais stocké sur le paiement et appliqué
-- à l'abonnement uniquement dans validateManualPayment.
-- NULL pour les paiements existants : la validation conserve alors le plan actuel.

ALTER TABLE "public"."subscription_payments"
  ADD COLUMN IF NOT EXISTS "plan" "public"."subscription_plan";

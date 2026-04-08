-- Ajouter la valeur 'awaiting_payment' à l'enum order_status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_payment' BEFORE 'pending';

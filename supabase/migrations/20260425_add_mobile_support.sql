-- Migration : support application mobile scanner
-- Ajouter le champ barcode sur la table products
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;

CREATE INDEX IF NOT EXISTS products_restaurant_id_barcode_idx
  ON products (restaurant_id, barcode);

-- Ajouter la valeur mobile_pos à l'enum order_source
ALTER TYPE order_source ADD VALUE IF NOT EXISTS 'mobile_pos';

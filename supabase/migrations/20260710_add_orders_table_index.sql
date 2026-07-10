-- Migration : index composite (restaurant_id, table_id) sur orders
-- getActiveOrdersForTable filtre exactement sur ces deux colonnes (+ status) ;
-- CONCURRENTLY évite un verrou bloquant sur la table orders en production.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "orders_restaurant_id_table_id_idx"
  ON "orders" ("restaurant_id", "table_id");

-- ============================================================
-- Suivi du cout de revient (CUMP) sur le stock operationnel
-- ============================================================
-- Ajoute :
--   * products.purchase_price      : prix d'achat par defaut (pre-remplissage)
--   * stocks.avg_cost              : cout unitaire moyen pondere (CUMP)
--   * stocks.last_purchase_price   : dernier cout d'entree unitaire
--   * stock_movements.*            : valorisation de chaque entree
-- Tous les montants sont en FCFA (entier, sans decimales).
-- ============================================================

-- 1. Prix d'achat par defaut sur l'article
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS purchase_price integer;

COMMENT ON COLUMN products.purchase_price IS
    'Prix d''achat par defaut en FCFA. Sert a pre-remplir la saisie lors d''une entree de stock ; le cout de revient reel est stocks.avg_cost.';

-- 2. Cout de revient sur le stock
ALTER TABLE stocks
    ADD COLUMN IF NOT EXISTS avg_cost            integer,
    ADD COLUMN IF NOT EXISTS last_purchase_price integer;

COMMENT ON COLUMN stocks.avg_cost IS
    'Cout unitaire moyen pondere (CUMP) en FCFA, recalcule a chaque entree valorisee. NULL si aucune entree valorisee.';
COMMENT ON COLUMN stocks.last_purchase_price IS
    'Dernier cout d''entree unitaire en FCFA (frais annexes inclus).';

-- 3. Valorisation des mouvements de stock
ALTER TABLE stock_movements
    ADD COLUMN IF NOT EXISTS purchase_price  integer,
    ADD COLUMN IF NOT EXISTS extra_costs     integer,
    ADD COLUMN IF NOT EXISTS unit_cost       integer,
    ADD COLUMN IF NOT EXISTS avg_cost_after  integer;

COMMENT ON COLUMN stock_movements.purchase_price IS 'Prix d''achat unitaire brut saisi (FCFA).';
COMMENT ON COLUMN stock_movements.extra_costs IS 'Frais annexes du lot : transport, douane, emballage (FCFA).';
COMMENT ON COLUMN stock_movements.unit_cost IS 'Cout de revient unitaire = purchase_price + extra_costs / quantite (FCFA).';
COMMENT ON COLUMN stock_movements.avg_cost_after IS 'CUMP du produit apres ce mouvement (FCFA), pour tracabilite.';

-- 4. Coherence : les couts ne peuvent pas etre negatifs
ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_purchase_price_positive;
ALTER TABLE products
    ADD CONSTRAINT products_purchase_price_positive
        CHECK (purchase_price IS NULL OR purchase_price >= 0);

ALTER TABLE stocks
    DROP CONSTRAINT IF EXISTS stocks_avg_cost_positive;
ALTER TABLE stocks
    ADD CONSTRAINT stocks_avg_cost_positive
        CHECK (avg_cost IS NULL OR avg_cost >= 0);

ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS stock_movements_costs_positive;
ALTER TABLE stock_movements
    ADD CONSTRAINT stock_movements_costs_positive
        CHECK (
            (purchase_price IS NULL OR purchase_price >= 0)
            AND (extra_costs IS NULL OR extra_costs >= 0)
            AND (unit_cost IS NULL OR unit_cost >= 0)
        );

-- 5. Index : recherche des articles a marge negative / stock valorise
CREATE INDEX IF NOT EXISTS idx_stocks_restaurant_avg_cost
    ON stocks (restaurant_id)
    WHERE avg_cost IS NOT NULL;

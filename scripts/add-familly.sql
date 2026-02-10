-- ============================================================
-- AKÔM - Migration : Ajout de la table FAMILIES
-- Date : 2026-02-09
-- Description : Ajout d'un niveau de classification intermédiaire
--               entre catégories et produits (ex: Vins, Bières dans Boissons)
-- ============================================================

BEGIN;

-- ============================================================
-- ÉTAPE 1 : Créer la table families
-- ============================================================

CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contrainte d'unicité : pas de familles avec le même nom dans une catégorie
    CONSTRAINT unique_family_per_category UNIQUE (restaurant_id, category_id, name)
);

-- ============================================================
-- ÉTAPE 2 : Créer les index pour la performance
-- ============================================================

-- Index pour les requêtes par restaurant
CREATE INDEX IF NOT EXISTS idx_families_restaurant 
    ON families(restaurant_id);

-- Index pour les requêtes par catégorie
CREATE INDEX IF NOT EXISTS idx_families_category 
    ON families(category_id);

-- Index composite pour le tri et filtrage
CREATE INDEX IF NOT EXISTS idx_families_restaurant_category_position 
    ON families(restaurant_id, category_id, position);

-- Index pour filtrer par statut
CREATE INDEX IF NOT EXISTS idx_families_restaurant_active 
    ON families(restaurant_id, is_active);

-- ============================================================
-- ÉTAPE 3 : Ajouter la colonne family_id dans products
-- ============================================================

-- Ajouter la colonne (NULL autorisé car optionnel)
ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS family_id UUID NULL 
    REFERENCES families(id) ON DELETE SET NULL;

-- Créer un index pour les requêtes par famille
CREATE INDEX IF NOT EXISTS idx_products_family 
    ON products(family_id) 
    WHERE family_id IS NOT NULL;

-- Index composite pour filtrer par restaurant et famille
CREATE INDEX IF NOT EXISTS idx_products_restaurant_family 
    ON products(restaurant_id, family_id);

-- ============================================================
-- ÉTAPE 4 : Trigger pour updated_at automatique
-- ============================================================

-- Réutiliser la fonction update_updated_at() existante
CREATE TRIGGER update_families_updated_at 
    BEFORE UPDATE ON families 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ÉTAPE 5 : Activer Row Level Security (RLS)
-- ============================================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ÉTAPE 6 : Créer les policies RLS
-- ============================================================

-- Policy SELECT : Les utilisateurs peuvent voir les familles de leurs restaurants
DROP POLICY IF EXISTS "Restaurant isolation for families SELECT" ON families;
CREATE POLICY "Restaurant isolation for families SELECT"
    ON families FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM restaurant_users 
            WHERE user_id = auth.uid()
        )
    );

-- Policy INSERT : Les utilisateurs peuvent créer des familles dans leurs restaurants
DROP POLICY IF EXISTS "Restaurant isolation for families INSERT" ON families;
CREATE POLICY "Restaurant isolation for families INSERT"
    ON families FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM restaurant_users 
            WHERE user_id = auth.uid()
        )
    );

-- Policy UPDATE : Les utilisateurs peuvent modifier les familles de leurs restaurants
DROP POLICY IF EXISTS "Restaurant isolation for families UPDATE" ON families;
CREATE POLICY "Restaurant isolation for families UPDATE"
    ON families FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM restaurant_users 
            WHERE user_id = auth.uid()
        )
    );

-- Policy DELETE : Les utilisateurs peuvent supprimer les familles de leurs restaurants
DROP POLICY IF EXISTS "Restaurant isolation for families DELETE" ON families;
CREATE POLICY "Restaurant isolation for families DELETE"
    ON families FOR DELETE
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM restaurant_users 
            WHERE user_id = auth.uid()
        )
    );

-- ============================================================
-- ÉTAPE 7 : Commentaires pour documentation
-- ============================================================

COMMENT ON TABLE families IS 
    'Sous-catégories optionnelles pour une classification plus fine des produits. 
     Exemple: dans "Boissons", on peut avoir les familles "Vins", "Bières", "Softs"';

COMMENT ON COLUMN families.category_id IS 
    'Catégorie parente à laquelle appartient cette famille';

COMMENT ON COLUMN families.position IS 
    'Position d''affichage dans l''ordre (permet le réordonnancement)';

COMMENT ON COLUMN products.family_id IS 
    'Famille optionnelle du produit (NULL si pas de classification par famille)';

-- ============================================================
-- ÉTAPE 8 : Vérification finale
-- ============================================================

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_column_exists BOOLEAN;
    v_indexes_count INTEGER;
    v_policies_count INTEGER;
BEGIN
    -- Vérifier que la table a été créée
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'families'
    ) INTO v_table_exists;
    
    -- Vérifier que la colonne a été ajoutée
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'family_id'
    ) INTO v_column_exists;
    
    -- Compter les index créés
    SELECT COUNT(*) INTO v_indexes_count
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND indexname LIKE 'idx_families%' 
        OR indexname LIKE 'idx_products_family%';
    
    -- Compter les policies RLS
    SELECT COUNT(*) INTO v_policies_count
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'families';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration FAMILIES terminée !';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Table families créée : %', v_table_exists;
    RAISE NOTICE 'Colonne family_id ajoutée : %', v_column_exists;
    RAISE NOTICE 'Index créés : %', v_indexes_count;
    RAISE NOTICE 'Policies RLS créées : %', v_policies_count;
    RAISE NOTICE '========================================';
    
    -- Alertes si quelque chose manque
    IF NOT v_table_exists THEN
        RAISE WARNING '⚠️  La table families n''a pas été créée correctement';
    END IF;
    
    IF NOT v_column_exists THEN
        RAISE WARNING '⚠️  La colonne family_id n''a pas été ajoutée à products';
    END IF;
    
    IF v_indexes_count < 6 THEN
        RAISE WARNING '⚠️  Nombre d''index insuffisant : % (attendu: 6)', v_indexes_count;
    END IF;
    
    IF v_policies_count < 4 THEN
        RAISE WARNING '⚠️  Nombre de policies insuffisant : % (attendu: 4)', v_policies_count;
    END IF;
    
    IF v_table_exists AND v_column_exists AND v_indexes_count >= 6 AND v_policies_count >= 4 THEN
        RAISE NOTICE '🎉 Tout est en ordre ! Prêt à utiliser.';
    END IF;
END $$;

COMMIT;
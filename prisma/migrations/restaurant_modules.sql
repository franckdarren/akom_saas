-- Migration : table restaurant_modules
-- À exécuter manuellement dans Supabase (SQL Editor)

CREATE TABLE IF NOT EXISTS restaurant_modules (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    module_key      TEXT        NOT NULL,
    is_enabled      BOOLEAN     NOT NULL DEFAULT true,
    enabled_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    enabled_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

    CONSTRAINT restaurant_modules_restaurant_id_module_key_key
        UNIQUE (restaurant_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_modules_restaurant_id
    ON restaurant_modules(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_modules_restaurant_enabled
    ON restaurant_modules(restaurant_id, is_enabled);

-- RLS
ALTER TABLE restaurant_modules ENABLE ROW LEVEL SECURITY;

-- Lecture : membres de la structure
CREATE POLICY "restaurant_modules_select" ON restaurant_modules
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
        )
    );

-- Écriture : admins uniquement
CREATE POLICY "restaurant_modules_admin_write" ON restaurant_modules
    FOR ALL USING (
        restaurant_id IN (
            SELECT ru.restaurant_id
            FROM restaurant_users ru
            JOIN roles r ON r.id = ru.role_id
            WHERE ru.user_id = auth.uid()
              AND r.slug = 'admin'
        )
    );

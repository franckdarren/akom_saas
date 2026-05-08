-- ============================================================
-- RLS COVERAGE FIX — Akom SaaS
-- ============================================================
-- À LANCER DANS LE SQL EDITOR SUPABASE.
--
-- Contexte :
-- L'audit sécurité a identifié plusieurs tables sensibles sans RLS.
-- Avec les GRANTs par défaut de Supabase sur le schéma `public`, un
-- utilisateur authentifié peut interroger/modifier ces tables
-- directement depuis le client browser @supabase/supabase-js.
--
-- Tables couvertes par ce fix :
--   • Critiques (privilege escalation possible) :
--     - restaurant_users
--     - roles, role_permissions
--     - invitations
--     - restaurant_singpay_configs
--     - restaurant_verification_documents
--     - restaurants
--   • Privacy / vandalisme :
--     - categories, families, tables
--     - order_items
--     - stock_movements
--     - warehouse_products, warehouse_stocks, warehouse_movements,
--       warehouse_to_ops_transfers
--     - restaurant_circuit_sheets, restaurant_verification_history
--     - support_tickets, ticket_messages
--     - system_logs
--
-- Pattern :
--   Toutes les tables liées à `restaurant_id` filtrent via la
--   fonction `auth.uid()` jointe à `restaurant_users`.
--   Les tables liées à `user_id` directement filtrent par auth.uid().
--   `permissions` (table globale) reste lisible par tous les authentifiés.
--   Les mutations (INSERT/UPDATE/DELETE) restent réservées au
--   `service_role` — toute la logique métier passe par Prisma serveur-side.
--
-- Idempotent : utilise DROP POLICY IF EXISTS + CREATE POLICY.
-- ============================================================

BEGIN;

-- ============================================================
-- HELPER FUNCTION : a_l_acces_au_restaurant(restaurant_id)
-- Retourne true si l'utilisateur courant est membre du restaurant.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_restaurant_member(_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM restaurant_users
        WHERE user_id = auth.uid()
          AND restaurant_id = _restaurant_id
    );
$$;

-- ============================================================
-- restaurants : un user voit les restaurants où il est membre
-- Pas d'INSERT/UPDATE/DELETE pour authenticated → tout passe par
-- les server actions (Prisma + service_role).
-- ============================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurants_select_member" ON restaurants;
CREATE POLICY "restaurants_select_member" ON restaurants
    FOR SELECT TO authenticated
    USING (is_restaurant_member(id));

-- ============================================================
-- restaurant_users : un user voit UNIQUEMENT ses propres memberships.
-- CRITIQUE : sans cette policy, un attaquant pouvait s'INSERT un
-- restaurant_users avec role='admin' pour devenir admin de
-- n'importe quel restaurant.
-- ============================================================

ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurant_users_select_own" ON restaurant_users;
CREATE POLICY "restaurant_users_select_own" ON restaurant_users
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR is_restaurant_member(restaurant_id)
    );

-- ============================================================
-- roles, role_permissions, permissions
-- ============================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_select_member" ON roles;
CREATE POLICY "roles_select_member" ON roles
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_permissions_select_member" ON role_permissions;
CREATE POLICY "role_permissions_select_member" ON role_permissions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = role_permissions.role_id
              AND is_restaurant_member(r.restaurant_id)
        )
    );

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissions_select_authenticated" ON permissions;
CREATE POLICY "permissions_select_authenticated" ON permissions
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================
-- invitations : seuls les membres du restaurant invitant peuvent
-- voir les invitations. Sans ça, n'importe quel user authentifié
-- pouvait lire les tokens en clair de toutes les invitations
-- de la plateforme.
-- ============================================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_select_member" ON invitations;
CREATE POLICY "invitations_select_member" ON invitations
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- restaurant_singpay_configs : wallet_id, merchant_code (privacy)
-- ============================================================

ALTER TABLE restaurant_singpay_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "singpay_config_select_member" ON restaurant_singpay_configs;
CREATE POLICY "singpay_config_select_member" ON restaurant_singpay_configs
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- restaurant_verification_documents : URLs de pièces d'identité
-- ============================================================

ALTER TABLE restaurant_verification_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verif_docs_select_member" ON restaurant_verification_documents;
CREATE POLICY "verif_docs_select_member" ON restaurant_verification_documents
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- restaurant_circuit_sheets, restaurant_verification_history
-- ============================================================

ALTER TABLE restaurant_circuit_sheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "circuit_sheets_select_member" ON restaurant_circuit_sheets;
CREATE POLICY "circuit_sheets_select_member" ON restaurant_circuit_sheets
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE restaurant_verification_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "verif_history_select_member" ON restaurant_verification_history;
CREATE POLICY "verif_history_select_member" ON restaurant_verification_history
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- categories, families, tables
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_member" ON categories;
CREATE POLICY "categories_select_member" ON categories
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "families_select_member" ON families;
CREATE POLICY "families_select_member" ON families
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tables_select_member" ON tables;
CREATE POLICY "tables_select_member" ON tables
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- order_items : isolation via order.restaurantId
-- ============================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_member" ON order_items;
CREATE POLICY "order_items_select_member" ON order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
              AND is_restaurant_member(o.restaurant_id)
        )
    );

-- ============================================================
-- stock_movements
-- ============================================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_select_member" ON stock_movements;
CREATE POLICY "stock_movements_select_member" ON stock_movements
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- warehouse_*
-- ============================================================

ALTER TABLE warehouse_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_products_select_member" ON warehouse_products;
CREATE POLICY "warehouse_products_select_member" ON warehouse_products
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE warehouse_stocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_stocks_select_member" ON warehouse_stocks;
CREATE POLICY "warehouse_stocks_select_member" ON warehouse_stocks
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE warehouse_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_movements_select_member" ON warehouse_movements;
CREATE POLICY "warehouse_movements_select_member" ON warehouse_movements
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE warehouse_to_ops_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "warehouse_transfers_select_member" ON warehouse_to_ops_transfers;
CREATE POLICY "warehouse_transfers_select_member" ON warehouse_to_ops_transfers
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

-- ============================================================
-- support_tickets, ticket_messages
-- ============================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_tickets_select_member" ON support_tickets;
CREATE POLICY "support_tickets_select_member" ON support_tickets
    FOR SELECT TO authenticated
    USING (is_restaurant_member(restaurant_id));

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticket_messages_select_member" ON ticket_messages;
CREATE POLICY "ticket_messages_select_member" ON ticket_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets t
            WHERE t.id = ticket_messages.ticket_id
              AND is_restaurant_member(t.restaurant_id)
        )
    );

-- ============================================================
-- system_logs : superadmin uniquement (côté serveur via service_role)
-- Aucun authenticated ne doit lire/modifier les logs système.
-- ============================================================

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
-- Aucune policy pour authenticated → tout est bloqué pour eux.
-- Seul service_role (côté serveur via Prisma admin) accède.

COMMIT;

-- ============================================================
-- VÉRIFICATION POST-APPLICATION
-- Lancer cette requête pour vérifier que toutes les tables
-- sensibles ont bien RLS activée.
-- ============================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY rowsecurity, tablename;

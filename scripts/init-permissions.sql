-- ============================================================
-- SCRIPT D'INITIALISATION DES PERMISSIONS ET RÔLES
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- Fonction helper pour créer ou récupérer une permission
CREATE OR REPLACE FUNCTION upsert_permission(
    p_resource text,
    p_action text,
    p_name text,
    p_description text,
    p_category text
) RETURNS uuid AS $$
DECLARE
v_permission_id uuid;
BEGIN
INSERT INTO permissions (resource, action, name, description, category, is_system)
VALUES (p_resource::permission_resource, p_action::permission_action, p_name, p_description, p_category, true)
    ON CONFLICT (resource, action) 
    DO UPDATE SET
    name = EXCLUDED.name,
               description = EXCLUDED.description,
               category = EXCLUDED.category
               RETURNING id INTO v_permission_id;

RETURN v_permission_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ÉTAPE 1 : Créer toutes les permissions système
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '🔐 Création des permissions système...';
END $$;

-- Restaurant
SELECT upsert_permission('restaurants', 'read', 'Voir les informations du restaurant', 'Permet de consulter les informations du restaurant', 'Restaurant');
SELECT upsert_permission('restaurants', 'update', 'Modifier le restaurant', 'Permet de modifier les informations du restaurant (nom, adresse, logo)', 'Restaurant');
SELECT upsert_permission('restaurants', 'manage', 'Gérer complètement le restaurant', 'Accès total à la gestion du restaurant', 'Restaurant');

-- Équipe
SELECT upsert_permission('users', 'read', 'Voir les utilisateurs', 'Permet de consulter la liste des employés', 'Équipe');
SELECT upsert_permission('users', 'create', 'Inviter des utilisateurs', 'Permet d''inviter de nouveaux employés', 'Équipe');
SELECT upsert_permission('users', 'update', 'Modifier les utilisateurs', 'Permet de modifier les rôles et informations des employés', 'Équipe');
SELECT upsert_permission('users', 'delete', 'Retirer des utilisateurs', 'Permet de retirer des employés du restaurant', 'Équipe');

-- Menu
SELECT upsert_permission('menu', 'read', 'Consulter le menu', 'Permet de voir les catégories et produits', 'Menu');
SELECT upsert_permission('categories', 'create', 'Créer des catégories', 'Permet de créer de nouvelles catégories de produits', 'Menu');
SELECT upsert_permission('categories', 'update', 'Modifier des catégories', 'Permet de modifier les catégories existantes', 'Menu');
SELECT upsert_permission('categories', 'delete', 'Supprimer des catégories', 'Permet de supprimer des catégories', 'Menu');
SELECT upsert_permission('products', 'create', 'Créer des produits', 'Permet d''ajouter de nouveaux produits au menu', 'Menu');
SELECT upsert_permission('products', 'update', 'Modifier des produits', 'Permet de modifier les produits (prix, description, disponibilité)', 'Menu');
SELECT upsert_permission('products', 'delete', 'Supprimer des produits', 'Permet de supprimer des produits du menu', 'Menu');

-- Tables
SELECT upsert_permission('tables', 'read', 'Voir les tables', 'Permet de consulter la liste des tables et leurs QR codes', 'Tables');
SELECT upsert_permission('tables', 'create', 'Créer des tables', 'Permet d''ajouter de nouvelles tables', 'Tables');
SELECT upsert_permission('tables', 'update', 'Modifier des tables', 'Permet de modifier les tables (activer/désactiver)', 'Tables');
SELECT upsert_permission('tables', 'delete', 'Supprimer des tables', 'Permet de supprimer des tables', 'Tables');

-- Commandes
SELECT upsert_permission('orders', 'read', 'Voir les commandes', 'Permet de consulter les commandes', 'Commandes');
SELECT upsert_permission('orders', 'update', 'Gérer les commandes', 'Permet de changer le statut des commandes (préparer, servir)', 'Commandes');
SELECT upsert_permission('orders', 'delete', 'Annuler des commandes', 'Permet d''annuler des commandes', 'Commandes');

-- Stocks
SELECT upsert_permission('stocks', 'read', 'Consulter les stocks', 'Permet de voir les quantités en stock', 'Stocks');
SELECT upsert_permission('stocks', 'update', 'Ajuster les stocks', 'Permet de modifier les quantités en stock', 'Stocks');
SELECT upsert_permission('stocks', 'manage', 'Gérer complètement les stocks', 'Accès total à la gestion des stocks', 'Stocks');

-- Paiements
SELECT upsert_permission('payments', 'read', 'Consulter les paiements', 'Permet de voir l''historique des paiements', 'Paiements');
SELECT upsert_permission('payments', 'manage', 'Gérer les paiements', 'Accès total aux paiements et remboursements', 'Paiements');

-- Statistiques
SELECT upsert_permission('stats', 'read', 'Voir les statistiques', 'Permet de consulter les statistiques et rapports', 'Statistiques');

-- Rôles
SELECT upsert_permission('roles', 'read', 'Voir les rôles', 'Permet de consulter les rôles existants', 'Rôles');
SELECT upsert_permission('roles', 'create', 'Créer des rôles', 'Permet de créer de nouveaux rôles personnalisés', 'Rôles');
SELECT upsert_permission('roles', 'update', 'Modifier des rôles', 'Permet de modifier les permissions des rôles personnalisés', 'Rôles');
SELECT upsert_permission('roles', 'delete', 'Supprimer des rôles', 'Permet de supprimer des rôles personnalisés', 'Rôles');

DO $$
DECLARE
v_permission_count integer;
BEGIN
SELECT COUNT(*) INTO v_permission_count FROM permissions;
RAISE NOTICE '✅ % permissions créées', v_permission_count;
END $$;

-- ============================================================
-- ÉTAPE 2 : Créer les rôles système pour chaque restaurant
-- ============================================================

DO $$
DECLARE
v_restaurant RECORD;
    v_admin_role_id uuid;
    v_kitchen_role_id uuid;
    v_cashier_role_id uuid;
    v_permission RECORD;
    v_admin_perms_count integer := 0;
    v_kitchen_perms_count integer := 0;
    v_users_count integer := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '👥 Création des rôles pour chaque restaurant...';
    
    -- Parcourir tous les restaurants
FOR v_restaurant IN SELECT * FROM restaurants LOOP
    RAISE NOTICE '';
RAISE NOTICE '📍 Configuration du restaurant: %', v_restaurant.name;
        
        -- Créer le rôle Administrateur
INSERT INTO roles (restaurant_id, name, description, is_system, is_active)
VALUES (
           v_restaurant.id,
           'Administrateur',
           'Accès complet à toutes les fonctionnalités du restaurant',
           true,
           true
       )
    ON CONFLICT (restaurant_id, name)
        DO UPDATE SET description = EXCLUDED.description
                   RETURNING id INTO v_admin_role_id;

-- Associer TOUTES les permissions au rôle Admin
v_admin_perms_count := 0;
FOR v_permission IN SELECT * FROM permissions LOOP
    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES (v_admin_role_id, v_permission.id)
                    ON CONFLICT (role_id, permission_id) DO NOTHING;
v_admin_perms_count := v_admin_perms_count + 1;
END LOOP;
        
        -- Créer le rôle Cuisine
INSERT INTO roles (restaurant_id, name, description, is_system, is_active)
VALUES (
           v_restaurant.id,
           'Cuisine',
           'Accès à la gestion des commandes en cuisine',
           true,
           true
       )
    ON CONFLICT (restaurant_id, name)
        DO UPDATE SET description = EXCLUDED.description
                   RETURNING id INTO v_kitchen_role_id;

-- Associer les permissions spécifiques au rôle Cuisine
v_kitchen_perms_count := 0;
FOR v_permission IN
SELECT * FROM permissions
WHERE
   -- Voir et gérer les commandes
    (resource = 'orders' AND action IN ('read', 'update'))
   -- Voir le menu
   OR (resource = 'menu' AND action = 'read')
   -- Voir les tables
   OR (resource = 'tables' AND action = 'read')
    LOOP
INSERT INTO role_permissions (role_id, permission_id)
VALUES (v_kitchen_role_id, v_permission.id)
ON CONFLICT (role_id, permission_id) DO NOTHING;
v_kitchen_perms_count := v_kitchen_perms_count + 1;
END LOOP;

        -- Rôle Caissière : créer et voir commandes + paiements
INSERT INTO roles (restaurant_id, name, description, is_system, is_active)
VALUES (v_restaurant.id, 'Caissière', 'Prise de commande et encaissement au comptoir', true, true)
    ON CONFLICT (restaurant_id, name)
        DO UPDATE SET description = EXCLUDED.description
                   RETURNING id INTO v_cashier_role_id;

-- Permissions caissière
INSERT INTO role_permissions (role_id, permission_id)
SELECT v_cashier_role_id, id FROM permissions
WHERE (resource = 'orders' AND action IN ('create', 'read', 'update'))
   OR (resource = 'payments' AND action IN ('create', 'read'))
   OR (resource = 'products' AND action = 'read')
   OR (resource = 'categories' AND action = 'read')
   OR (resource = 'tables' AND action = 'read')
    ON CONFLICT DO NOTHING;

-- Migrer les utilisateurs existants vers le nouveau système
v_users_count := 0;
UPDATE restaurant_users
SET role_id = CASE
                  WHEN role = 'admin' THEN v_admin_role_id
                  WHEN role = 'kitchen' THEN v_kitchen_role_id
                  ELSE v_kitchen_role_id  -- Par défaut, kitchen
    END
WHERE restaurant_id = v_restaurant.id
  AND role_id IS NULL;  -- Ne migrer que ceux qui n'ont pas encore de roleId

GET DIAGNOSTICS v_users_count = ROW_COUNT;

RAISE NOTICE '  ✅ Rôle Admin créé avec % permissions', v_admin_perms_count;
        RAISE NOTICE '  ✅ Rôle Cuisine créé avec % permissions', v_kitchen_perms_count;
        RAISE NOTICE '  ✅ % utilisateur(s) migré(s)', v_users_count;
END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Initialisation terminée avec succès!';
END $$;

-- ============================================================
-- ÉTAPE 3 : Nettoyage - Supprimer la fonction helper
-- ============================================================

DROP FUNCTION IF EXISTS upsert_permission(text, text, text, text, text);

-- ============================================================
-- ÉTAPE 4 : Vérification finale
-- ============================================================

DO $$
DECLARE
v_permissions_count integer;
    v_roles_count integer;
    v_role_permissions_count integer;
    v_restaurants_count integer;
BEGIN
SELECT COUNT(*) INTO v_permissions_count FROM permissions;
SELECT COUNT(*) INTO v_roles_count FROM roles WHERE is_system = true;
SELECT COUNT(*) INTO v_role_permissions_count FROM role_permissions;
SELECT COUNT(*) INTO v_restaurants_count FROM restaurants;

RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RÉSUMÉ DE L''INITIALISATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ % permissions système créées', v_permissions_count;
    RAISE NOTICE '✅ % rôles système créés (% restaurants × 2)', v_roles_count, v_restaurants_count;
    RAISE NOTICE '✅ % associations rôle-permission créées', v_role_permissions_count;
    RAISE NOTICE '========================================';
END $$;
```

## Instructions d'Exécution

1. **Ouvrir l'éditeur SQL de Supabase** :
   - Allez dans votre projet Supabase
   - Cliquez sur "SQL Editor" dans le menu de gauche
   - Cliquez sur "New Query"

2. **Copier-coller le script** :
   - Copiez tout le script SQL ci-dessus
   - Collez-le dans l'éditeur SQL

3. **Exécuter le script** :
   - Cliquez sur "Run" (ou Ctrl+Enter)
   - Le script va s'exécuter et afficher des messages de progression

4. **Vérifier les résultats** :
   - Vous devriez voir des messages comme :
```
🔐 Création des permissions système...
✅ 32 permissions créées

👥 Création des rôles pour chaque restaurant...

📍 Configuration du restaurant: Mon Restaurant
✅ Rôle Admin créé avec 32 permissions
✅ Rôle Cuisine créé avec 4 permissions
✅ 2 utilisateur(s) migré(s)

🎉 Initialisation terminée avec succès!
     
     ========================================
📊 RÉSUMÉ DE L'INITIALISATION
     ========================================
     ✅ 32 permissions système créées
     ✅ 2 rôles système créés (1 restaurants × 2)
     ✅ 36 associations rôle-permission créées
     ========================================
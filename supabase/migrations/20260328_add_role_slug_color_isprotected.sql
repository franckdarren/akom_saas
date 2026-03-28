-- Migration : Ajouter slug, color et isProtected sur la table roles
-- Phase 1 de la refonte du système de permissions

-- 1. Ajout des nouvelles colonnes
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_protected" BOOLEAN NOT NULL DEFAULT false;

-- 2. Contrainte d'unicité sur (restaurant_id, slug) — les slugs NULL sont ignorés par PostgreSQL
CREATE UNIQUE INDEX IF NOT EXISTS "roles_restaurant_id_slug_key"
    ON "roles" ("restaurant_id", "slug");

-- 3. Mettre à jour les rôles système existants avec leur slug
UPDATE "roles" SET "slug" = 'admin', "color" = '#3B82F6', "is_protected" = true
    WHERE "name" = 'Administrateur' AND "is_system" = true AND "slug" IS NULL;

UPDATE "roles" SET "slug" = 'kitchen', "color" = '#22C55E'
    WHERE "name" = 'Cuisine' AND "is_system" = true AND "slug" IS NULL;

-- Note : le rôle Caissier sera créé par le script init-permissions.ts
-- qui doit être exécuté après cette migration.

-- 4. IMPORTANT : Après cette migration, exécuter le script init-permissions.ts
-- pour créer le rôle Caissier et migrer les utilisateurs legacy :
--   npx tsx scripts/init-permissions.ts

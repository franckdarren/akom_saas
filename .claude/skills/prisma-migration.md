# Skill : Migration Prisma + RLS

Étapes complètes pour ajouter/modifier un modèle dans Akôm.

## 1. Modifier le schéma Prisma

```prisma
// prisma/schema.prisma

model <NouveauModel> {
  id           String     @id @default(uuid()) @db.Uuid
  restaurantId String     @map("restaurant_id") @db.Uuid
  name         String
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  restaurant Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)

  @@map("<nouveau_model>")
}
```

**Règles de nommage :**
- Modèle Prisma : `PascalCase`
- Table SQL : `snake_case` via `@@map()`
- Champ Prisma : `camelCase`
- Colonne SQL : `snake_case` via `@map()`

## 2. Générer la migration

```bash
npx prisma migrate dev --name <description_courte>
# Ex: npx prisma migrate dev --name add_expense_category
```

Cela génère `prisma/migrations/<timestamp>_<name>/migration.sql`.

## 3. SQL brut pour Supabase (à appliquer manuellement)

Après la migration locale, appliquer aussi via l'outil Supabase MCP ou l'éditeur SQL Supabase.

```sql
-- Création de la table
CREATE TABLE <nouveau_model> (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur restaurant_id (quasi-obligatoire sur toutes les tables liées)
CREATE INDEX idx_<nouveau_model>_restaurant_id ON <nouveau_model>(restaurant_id);

-- RLS
ALTER TABLE <nouveau_model> ENABLE ROW LEVEL SECURITY;

-- Policy : accès par restaurant_id
CREATE POLICY "<nouveau_model>_restaurant_isolation"
ON <nouveau_model>
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users
    WHERE user_id = auth.uid()
  )
);
```

## 4. Régénérer le client Prisma

```bash
npx prisma generate
```

## 5. Vérification post-migration

```bash
# Vérifier que la table existe et a RLS activé
# Dans l'éditeur SQL Supabase :
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = '<nouveau_model>';
```

## Cas d'ajout de colonne

```prisma
// Ajouter dans le modèle existant :
description String? // nullable = pas de migration data requise
// OU
isActive Boolean @default(true) @map("is_active") // avec valeur par défaut
```

```sql
-- SQL correspondant :
ALTER TABLE <table> ADD COLUMN description TEXT;
-- OU
ALTER TABLE <table> ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
```

## Cas d'enum Prisma

```prisma
enum <NomEnum> {
  valeur_a
  valeur_b

  @@map("<nom_enum>")
}
```

```sql
CREATE TYPE <nom_enum> AS ENUM ('valeur_a', 'valeur_b');
```

## Checklist

- [ ] `@@map()` défini (table en snake_case)
- [ ] `@map()` sur chaque champ multi-mot
- [ ] `restaurantId` présent avec relation → `Restaurant` (onDelete: Cascade)
- [ ] `npx prisma migrate dev --name <nom>` exécuté
- [ ] SQL brut préparé pour Supabase (CREATE TABLE + RLS)
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` dans le SQL
- [ ] Policy RLS créée (voir skill `rls-policy.md`)
- [ ] Index sur `restaurant_id` créé
- [ ] `npx prisma generate` exécuté après migration

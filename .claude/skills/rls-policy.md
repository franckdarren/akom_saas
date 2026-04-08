# Skill : Policy RLS Supabase

Templates de policies Row Level Security pour les tables Akôm.

## Politique standard (isolation par restaurant)

Applicable à toute table liée à `restaurant_id` — c'est le pattern universel Akôm.

```sql
-- Activer RLS
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Policy ALL : accès uniquement aux membres du restaurant
CREATE POLICY "<table>_restaurant_isolation"
ON <table>
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users
    WHERE user_id = auth.uid()
  )
);
```

## Policy lecture publique (catalogue public)

Pour les tables accessibles sans auth (menu public, catalogue, etc.) :

```sql
-- Lecture publique sans restriction
CREATE POLICY "<table>_public_read"
ON <table>
FOR SELECT
USING (true);

-- Écriture réservée aux membres
CREATE POLICY "<table>_member_write"
ON <table>
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users
    WHERE user_id = auth.uid()
  )
);
```

## Policy liée (table sans restaurant_id direct)

Pour une table enfant qui n'a pas de `restaurant_id` direct mais une FK vers une table qui en a un :

```sql
-- Ex: stock_movements n'a pas de restaurant_id, mais est lié à stocks
CREATE POLICY "stock_movements_restaurant_isolation"
ON stock_movements
FOR ALL
USING (
  restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users
    WHERE user_id = auth.uid()
  )
);
-- Note: si la table a bien restaurant_id en dupliqué (pattern Akôm), utiliser le pattern standard.
```

## Vérification

```sql
-- Vérifier que RLS est actif sur une table
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = '<table>';

-- Lister les policies d'une table
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = '<table>';
```

## Via Supabase MCP

```
mcp__claude_ai_Supabase__execute_sql avec :
SELECT policyname, cmd FROM pg_policies WHERE tablename = '<table>';
```

## Désactiver temporairement (développement uniquement)

```sql
-- ⚠️ JAMAIS en production
ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;
```

## Checklist

- [ ] `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY` exécuté
- [ ] Policy créée avec nom descriptif : `<table>_<type>`
- [ ] `auth.uid()` utilisé (jamais `current_user`)
- [ ] Join sur `restaurant_users` (table de membership Akôm)
- [ ] Index `idx_<table>_restaurant_id` créé (perf des filtres RLS)
- [ ] Vérification via `pg_policies` après création
- [ ] Si table publique : deux policies séparées (SELECT public, ALL members)

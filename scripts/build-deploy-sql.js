const fs = require('fs')
const path = require('path')

const root = 'C:\\Users\\Franck\\Documents\\dev\\akom\\akom_saas'
const outPath = path.join(root, 'scripts', 'deploy-fresh-database.sql')

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n')

const SOURCES = {
    baseline: 'supabase/migrations/00000000000000_baseline_schema.sql',
    postRestore: 'scripts/docs/post-restore.sql',
    tenant: 'scripts/supabase-migrations.sql',
    rls: 'scripts/rls-coverage-fix.sql',
    notifications: 'supabase/migrations/20260507_add_notifications.sql',
    modules: 'prisma/migrations/restaurant_modules.sql',
    permissions: 'scripts/init-permissions.sql',
}

// Les scripts écrits pour être lancés seuls ouvrent leur propre transaction.
// Ici tout est déjà dans une transaction unique : on neutralise les
// BEGIN;/COMMIT; internes, sinon le COMMIT interne validerait la
// transaction globale au milieu du fichier.
const stripTransaction = (sql) =>
    sql
        .split('\n')
        .map((l) =>
            /^\s*(BEGIN|COMMIT)\s*;\s*$/.test(l)
                ? `-- ${l.trim()}  (retiré : transaction gérée globalement en tête de fichier)`
                : l
        )
        .join('\n')

// Clés primaires uuid sans DEFAULT côté base après la phase 1.
// Liste relevée sur la base réelle (information_schema) après application
// du baseline seul. `prisma migrate diff` n'émet pas de DEFAULT pour les
// `@default(uuid())` : Prisma génère l'UUID côté client. Les 3 PK absentes
// de cette liste (restaurant_circuit_sheets, restaurant_verification_documents,
// restaurant_verification_history) utilisent déjà `@default(dbgenerated(...))`.
const PK_SANS_DEFAULT = [
    'cash_sessions', 'categories', 'daily_stats', 'expenses', 'families',
    'inventory_lines', 'inventory_sessions', 'invitations', 'manual_revenues',
    'notification_deliveries', 'notification_preferences', 'notifications',
    'order_items', 'orders', 'payments', 'permissions', 'products',
    'restaurant_modules', 'restaurant_singpay_configs', 'restaurant_users',
    'restaurants', 'role_permissions', 'roles', 'stock_movements', 'stocks',
    'subscription_email_logs', 'subscription_payments', 'subscriptions',
    'support_tickets', 'system_logs', 'tables', 'ticket_messages',
    'warehouse_movements', 'warehouse_products', 'warehouse_stock',
    'warehouse_to_ops_transfers',
]

// Colonnes `updated_at` NOT NULL sans DEFAULT après la phase 1 : Prisma
// `@updatedAt` est renseigné côté client, donc migrate diff n'émet rien.
// (`created_at`, lui, est en `@default(now())` → DEFAULT CURRENT_TIMESTAMP.)
const UPDATED_AT_SANS_DEFAULT = [
    'categories', 'daily_stats', 'expenses', 'families', 'inventory_sessions',
    'invitations', 'manual_revenues', 'notification_preferences', 'order_items',
    'orders', 'payments', 'products', 'restaurant_circuit_sheets',
    'restaurant_singpay_configs', 'restaurant_users',
    'restaurant_verification_documents', 'restaurants', 'roles', 'stocks',
    'subscription_payments', 'subscriptions', 'support_tickets', 'tables',
    'warehouse_products', 'warehouse_stock',
]

const defaultsBody = [
    '-- Prisma genere certaines valeurs cote client, pas cote base :',
    '--   • `@default(uuid())`  -> l\'UUID est produit par le client Prisma',
    '--   • `@updatedAt`        -> l\'horodatage est produit par le client Prisma',
    '--',
    '-- `prisma migrate diff` n\'emet donc AUCUN DEFAULT pour ces colonnes.',
    '-- Consequence : tout INSERT en SQL brut — le seed de la phase 7, les',
    '-- futures migrations manuelles, un insert depuis le SQL Editor —',
    '-- echoue sur « null value in column "id"/"updated_at" violates',
    '-- not-null constraint ».',
    '--',
    '-- C\'est le mode de migration documente de ce projet (SQL brut execute',
    '-- a la main dans Supabase, jamais `prisma migrate`), donc on repose les',
    '-- DEFAULT cote base. Sans effet sur l\'application : le client Prisma',
    '-- fournit toujours ces deux valeurs lui-meme, le DEFAULT ne sert',
    '-- qu\'aux INSERT SQL bruts.',
    '--',
    '-- Note : `created_at` n\'est pas concerne (`@default(now())` produit',
    '-- bien un DEFAULT CURRENT_TIMESTAMP cote base).',
    '',
    '-- gen_random_uuid() est natif depuis PostgreSQL 13 ; pgcrypto est',
    '-- recree par la phase 2, cette ligne couvre le cas d\'un PG plus ancien.',
    'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
    '',
    '-- ------------------------------------------------------------',
    `-- Cles primaires (${PK_SANS_DEFAULT.length} tables)`,
    '-- Les 3 PK absentes de cette liste sont deja pourvues d\'un DEFAULT par',
    '-- schema.prisma via @default(dbgenerated("gen_random_uuid()")) :',
    '--   restaurant_circuit_sheets, restaurant_verification_documents,',
    '--   restaurant_verification_history',
    '-- ------------------------------------------------------------',
    '',
    ...PK_SANS_DEFAULT.map(
        (t) => `ALTER TABLE ${t} ALTER COLUMN id SET DEFAULT gen_random_uuid();`
    ),
    '',
    '-- ------------------------------------------------------------',
    `-- Colonnes updated_at (${UPDATED_AT_SANS_DEFAULT.length} tables)`,
    '-- ------------------------------------------------------------',
    '',
    ...UPDATED_AT_SANS_DEFAULT.map(
        (t) => `ALTER TABLE ${t} ALTER COLUMN updated_at SET DEFAULT now();`
    ),
].join('\n')

const header = `-- ============================================================
-- AKÔM SAAS — DÉPLOIEMENT COMPLET SUR UNE BASE SUPABASE VIDE
-- ============================================================
--
-- Fichier unique à exécuter dans le SQL Editor de Supabase sur un
-- projet neuf (0 table, 0 bucket). Il regroupe, dans l'ordre, les
-- 7 scripts de provisioning du dépôt :
--
--   1. ${SOURCES.baseline}
--        tables, enums, index, clés étrangères (généré depuis schema.prisma)
--  1b. (ajout de ce fichier, aucune source)
--        DEFAULT gen_random_uuid() sur les 36 clés primaires et
--        DEFAULT now() sur les 25 colonnes updated_at que
--        prisma migrate diff laisse sans valeur par défaut
--   2. ${SOURCES.postRestore}
--        extensions, RLS (13 tables), realtime, buckets + policies storage
--   3. ${SOURCES.tenant}
--        triggers updated_at + RLS tenant sur orders, payments,
--        products, stocks (couvertes nulle part ailleurs)
--   4. ${SOURCES.rls}
--        RLS sur les tables restantes
--   5. ${SOURCES.notifications}
--        RLS notifications (le reste du fichier est no-op après la phase 1)
--   6. ${SOURCES.modules}
--        RLS restaurant_modules (le reste du fichier est no-op après la phase 1)
--   7. ${SOURCES.permissions}
--        seed des permissions système + rôles par défaut
--
-- CONTRAINTE D'ORDRE : la phase 2 doit passer AVANT la phase 5, car
-- post-restore.sql exécute un « ALTER PUBLICATION supabase_realtime
-- ADD TABLE notifications » non protégé, alors que la phase 5 l'encadre
-- par un garde EXCEPTION WHEN duplicate_object. Dans l'autre sens,
-- la phase 2 échoue.
--
-- Les phases 2, 3 et 4 se recoupent sur quelques tables (cash_sessions,
-- expenses, manual_revenues, subscriptions, subscription_payments) avec
-- des noms de policy différents. Résultat : deux policies permissives
-- aux prédicats équivalents cohabitent sur ces tables. Redondant mais
-- sans effet sur le résultat des requêtes — les prédicats sont combinés
-- par OR et portent la même condition d'appartenance au tenant.
--
-- Le tout est dans UNE SEULE transaction : en cas d'erreur, rien n'est
-- appliqué et la base reste vide.
--
-- Ne PAS rejouer les autres fichiers de supabase/migrations/ : leur
-- contenu est déjà inclus dans le baseline de la phase 1.
--
-- FICHIER GÉNÉRÉ PAR CONCATÉNATION — ne pas l'éditer à la main.
-- Modifier les 6 sources ci-dessus, puis régénérer. Le baseline de
-- la phase 1 se régénère lui-même avec (lecture seule, ne touche pas
-- à la base) :
--
--   npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma \\
--     --script -o supabase/migrations/00000000000000_baseline_schema.sql
--
-- ============================================================

BEGIN;
`

const footer = `
COMMIT;


-- ============================================================
-- RESTE À FAIRE — NON COUVERT PAR CE FICHIER
-- ============================================================
--
-- RLS absente sur 4 tables — aucun script du dépôt ne les couvre :
--   daily_stats, inventory_sessions, inventory_lines, subscription_email_logs
--
-- Avec les GRANT par défaut de Supabase sur le schéma public, un
-- utilisateur authentifié peut les interroger via la clé anon depuis
-- le navigateur : fuite inter-tenant sur le chiffre d'affaires
-- (daily_stats) et sur les sessions d'inventaire.
--
-- Hors SQL :
--   • Auth > URL Configuration — Site URL + Redirect URLs doivent
--     inclure {NEXT_PUBLIC_APP_URL}/api/auth/callback
--   • Variables d'environnement absentes de .env — NEXT_PUBLIC_APP_URL,
--     SUPER_ADMIN_EMAILS, CRON_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL
--   • Secrets GitHub Actions — APP_URL, CRON_SECRET
-- ============================================================
`

function step(num, title, source, body) {
    return [
        '',
        '',
        '-- ############################################################',
        `-- PHASE ${num} — ${title}`,
        `-- Source : ${source}`,
        '-- ############################################################',
        '',
        body.replace(/\n+$/, ''),
        '',
    ].join('\n')
}

// --- Phase 7 : ne garder que la partie SQL (le fichier se termine par de la doc Markdown)
const permLines = read(SOURCES.permissions).split('\n')
const fenceIdx = permLines.findIndex((l) => /^```/.test(l))
if (fenceIdx === -1) throw new Error('Clôture Markdown introuvable dans init-permissions.sql')
const permBody = permLines.slice(0, fenceIdx).join('\n')

const parts = [
    header,
    step(1, 'SCHÉMA DE BASE', SOURCES.baseline, read(SOURCES.baseline)),
    step(
        '1b',
        'VALEURS PAR DÉFAUT — CLÉS PRIMAIRES ET updated_at',
        'aucune — ajout propre à ce fichier, voir le commentaire ci-dessous',
        defaultsBody
    ),
    step(2, 'EXTENSIONS, RLS, REALTIME, STORAGE', SOURCES.postRestore, read(SOURCES.postRestore)),
    step(
        3,
        'TRIGGERS updated_at + RLS TENANT (orders, payments, products, stocks)',
        SOURCES.tenant,
        stripTransaction(read(SOURCES.tenant))
    ),
    step(4, 'RLS — TABLES RESTANTES', SOURCES.rls, stripTransaction(read(SOURCES.rls))),
    step(5, 'RLS NOTIFICATIONS', SOURCES.notifications, read(SOURCES.notifications)),
    step(6, 'RLS RESTAURANT_MODULES', SOURCES.modules, read(SOURCES.modules)),
    step(
        7,
        'SEED PERMISSIONS ET RÔLES',
        `${SOURCES.permissions} (lignes 1-${fenceIdx} ; la suite du fichier est de la documentation Markdown, pas du SQL)`,
        permBody
    ),
    footer,
]

const content = parts.join('\n')
fs.writeFileSync(outPath, content, 'utf8')

console.log('écrit  :', outPath)
console.log('lignes :', content.split('\n').length)
console.log('taille :', (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1), 'Ko')
console.log('BEGIN  :', (content.match(/^BEGIN;$/gm) || []).length)
console.log('COMMIT :', (content.match(/^COMMIT;$/gm) || []).length)

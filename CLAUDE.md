# CLAUDE.md

Ce fichier fournit des instructions a Claude Code (claude.ai/code) pour travailler dans ce depot.

## Presentation du projet

**Akom** est une plateforme SaaS multi-tenant de commerce et de gestion pour tout type de structure commerciale ciblant les marches africains (principalement le Gabon) : restaurants, boutiques, commerces de detail, hotels, prestataires de services, salons de beaute, transport, etc. L'interface est entierement en francais. Elle prend en charge les methodes de paiement locales via l'agregateur **SINGPAY** (Airtel Money, Moov Money) ainsi que les paiements en especes et par carte.

Le coeur du produit est un **catalogue en ligne** (produits et services) avec **prise de commandes multi-canal** (QR code, lien public, comptoir, dashboard) et **encaissement integre**. Le mot "restaurant" dans le code (`Restaurant`, `restaurantId`) est un heritage de la v1 — le modele represente en realite toute structure commerciale. Le champ `activityType` sur `Restaurant` (`restaurant`, `retail`, `hotel`, `beauty`, `transport`, `service_rental`, `vehicle_rental`, `other`) pilote les labels dynamiques dans l'UI et adapte le vocabulaire metier a chaque type d'activite.

## Commandes

```bash
npm run dev        # Serveur de developpement avec Turbopack
npm run build      # Build de production
npm run lint       # ESLint
npm run start      # Lancement du serveur de production
```

Aucun framework de test n'est configure. Le repertoire `/app/test/` contient des pages de test manuelles.

Apres toute modification du schema, executer `npx prisma generate` (s'execute aussi automatiquement via `postinstall`). Migrations : `npx prisma migrate dev --name <name>`.

## Architecture

### Stack technique

- **Next.js 16** App Router + **React 19** + **TypeScript**
- **Prisma 7** ORM sur **PostgreSQL** heberge sur Supabase
- Supabase Auth pour l'authentification
- **Tailwind CSS v4** (via PostCSS, sans fichier de config) + **shadcn/ui** (style new-york, base zinc)
- **Zod 4** pour la validation, **Resend** + **Nodemailer** pour les emails

### Groupes de routes

```
app/
├── (auth)/         # Pages publiques d'authentification (login, register, reset)
├── (dashboard)/    # Routes protegees (auth + abonnement actif requis)
├── (public)/       # Pages publiques (mentions legales, landing)
├── api/            # Endpoints REST (CRON, webhooks, API menu publique)
└── onboarding/     # Flux de creation de structure commerciale (restaurant, boutique, etc.)
```

### Couche de donnees

Toutes les mutations passent par des **Server Actions** Next.js dans `lib/actions/`, organises par domaine (auth, restaurant, order, product, stock, payment, etc.). Les actions retournent un type `ActionResult<T>` uniforme avec gestion des erreurs. Utiliser les Server Actions pour les mutations — les API routes sont reservees aux webhooks et aux CRON.

Clients Supabase :

- `lib/supabase/client.ts` — client navigateur
- `lib/supabase/server.ts` — client serveur/SSR
- `lib/supabase/admin.ts` — client admin avec service role

### Multi-tenant

Les utilisateurs peuvent appartenir a plusieurs structures commerciales (appelees "restaurants" dans le code par heritage). La structure active est stockee dans le cookie `akom_current_restaurant_id`. Le middleware verifie dans l'ordre :

1. L'authentification
2. L'abonnement actif (les abonnements expires sont rediriges vers une page de facturation)
3. Les droits d'acces a la structure selectionnee

### RBAC

Systeme de permissions personnalise avec `PermissionResource` (restaurants, users, menu, categories, products, tables, orders, stocks, payments, stats, roles) x `PermissionAction` (create, read, update, delete, manage). Applique cote client via `lib/hooks/use-permissions.ts` et cote serveur dans les server actions.

Roles par defaut : `admin`, `kitchen`, `cashier` (plus le role plateforme `superadmin`).

### Plans d'abonnement

`starter`, `business`, `premium` avec support de la periode d'essai. L'acces aux fonctionnalites est controle via `lib/hooks/use-subscription-features.ts`. Le middleware bloque l'acces au dashboard pour les abonnements expires.

### Temps reel

Les mises a jour des commandes en direct passent par des subscriptions WebSocket Supabase dans `lib/hooks/use-realtime-orders.ts` et `use-orders-realtime.tsx`. Utilise par le systeme d'affichage cuisine (KDS) et le POS.

### Taches planifiees

GitHub Actions cron (`.github/workflows/cron-tasks.yml`) appelle des routes API authentifiees avec `CRON_SECRET` :

- Verification et suspension des abonnements expires
- Annulation des commandes abandonnees (en attente depuis plus de 4h)
- Alerte sur les commandes lentes (en attente depuis plus de 15min)
- Archivage des anciennes commandes (plus de 90 jours)
- Envoi de rappels d'abonnement (J-7, J-3, J-1)
- Envoi des rapports quotidiens aux admins de structure
- Verification de la coherence des stocks

### Patterns importants

- L'alias `@/` pointe vers la racine du projet
- `lib/utils.ts` exporte le helper `cn()` pour la fusion des classes Tailwind
- `lib/serialize.ts` gere la serialisation des types Prisma `Decimal`/`Date` pour les composants client
- L'acces superadmin est controle par une liste blanche d'emails dans `lib/auth/superadmin.ts`
- Le consentement aux cookies (RGPD) est gere par les composants dans `components/gdpr/`
- Appeler `useNavigationLoading` + `startLoading()` avant tout `router.push()`
- RLS active sur toutes les tables liees a `restaurant_id`
- Labels d'activite dynamiques : voir `lib/config/activity-labels.ts`

## Regles absolues

- Toujours filtrer les requetes Prisma par `restaurantId`
- Ne jamais bypasser Supabase Auth — toujours appeler `supabase.auth.getUser()` une seule fois en haut de fonction
- Dates Prisma : toujours utiliser `new Date('YYYY-MM-DD')` (ISO UTC), jamais `new Date(year, month, day)`
- Migrations : ecrire aussi le SQL brut pour Supabase en plus du schema Prisma
- Pas de `any` en TypeScript — typage strict obligatoire
- Gestionnaire de packages : `npm` uniquement

## Ce que Claude doit eviter

- Proposer des alternatives a la stack (pas de tRPC, pas de Drizzle, etc.)
- Sur-ingenierie — priorite au MVP simple et fonctionnel
- Creer des API routes la ou des Server Actions suffisent
- Parler d'"application restaurant" — Akom est une plateforme de commerce generaliste ; utiliser "structure commerciale" ou "etablissement" selon le contexte
- Renommer le modele `Restaurant` ou le champ `restaurantId` — c'est un heritage assume, ne pas refactoriser sans demande explicite

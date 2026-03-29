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

## Design system — typographie

Les classes sémantiques et le token `--text-2xs` sont définis dans `app/globals.css` (`@layer components`).

**Toujours utiliser ces classes — ne jamais recréer les patterns à la main :**

| Rôle | Classe |
|------|--------|
| Titre de page h1 | `type-page-title` — responsive intégré (`xl→2xl→3xl`) |
| Titre hero / page plans | `type-hero-title` |
| Titre de section | `type-section-title` |
| CardTitle | `type-card-title` |
| DialogTitle / SheetTitle | `type-dialog-title` |
| Corps de texte | `type-body` |
| Corps atténué (CardDescription) | `type-body-muted` |
| Description courte sous titre | `type-description` |
| Label de formulaire | `type-label` |
| Label uppercase (modales, dropdowns) | `type-label-meta` |
| Timestamp, métadonnée compacte | `type-caption` |
| Entête de tableau uppercase | `type-table-head` |
| Badge (hors composant Badge) | `type-badge` |
| Code / identifiant technique | `type-code` |

**Interdits absolus :**
- `text-[Xpx]` / `text-[Xrem]` — utiliser `text-2xs`, `text-xs`, `text-sm`, etc.
- `text-gray-*`, `text-zinc-*` — utiliser `text-foreground` ou `text-muted-foreground`
- `font-regular` — classe Tailwind inexistante, utiliser `font-normal`
- Écrire `text-xl sm:text-2xl md:text-3xl font-bold tracking-tight` à la main — utiliser `type-page-title`

## Design system — espacement

Les classes sémantiques sont définies dans `app/globals.css` (`@layer components`).

**Toujours utiliser ces classes — ne jamais recréer les patterns à la main :**

| Rôle | Classe |
|------|--------|
| Conteneur racine d'une page dashboard | `layout-page` — `flex flex-1 flex-col gap-4 p-4` |
| Empilage de sections majeures | `layout-sections` — `flex flex-col gap-6` |
| Contenu interne d'une Card | `layout-card-body` — `space-y-4` |
| Formulaire (entre groupes de champs) | `layout-form` — `space-y-4` |
| Groupe champ (label + input + erreur) | `layout-field` — `space-y-2` |
| Rangée inline (icône + texte, boutons) | `layout-inline` — `flex items-center gap-2` |
| État vide (liste vide dans une Card) | `layout-empty-state` — `flex flex-col items-center gap-3 py-12` |
| Grille de métriques / KPIs | `layout-kpi-grid` — `grid grid-cols-2 gap-4 sm:grid-cols-4` |

**Interdits absolus :**
- `space-y-5` — utiliser `space-y-4` ou `space-y-6`
- `py-10` dans un état vide — utiliser `layout-empty-state`
- `p-6 space-y-4` sur `CardContent` — le `px-6` est déjà dans le composant ; écrire `layout-card-body` sur l'enfant direct
- `mr-2` pour espacer des boutons — utiliser `layout-inline` (gap sur le parent)
- `flex flex-1 flex-col gap-6 p-6` à la main — utiliser `layout-page`

## Design system — couleurs

Les variables de couleur sont definies dans `app/globals.css` (tokens Tailwind v4 via `@theme inline`). Toujours utiliser les classes semantiques Tailwind plutot que des valeurs hex ou des couleurs arbitraires :

- **UI** : `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `background`, `foreground`, `card`, `popover`
- **Semantique** : `success`, `success-foreground`, `success-subtle`, `warning`, `warning-foreground`, `warning-subtle`, `info`, `info-foreground`, `info-subtle`
- **Statuts commandes** : `status-pending`, `status-preparing`, `status-ready`, `status-delivered`, `status-cancelled` (avec variante `-fg`)

Exemples corrects : `bg-primary`, `text-destructive`, `border-warning`, `bg-success-subtle`
Interdit : `bg-blue-500`, `text-red-600`, couleurs hex inline, etc.

**Exception emails** : les templates HTML email ne supportent pas les variables CSS. Utiliser les constantes de `lib/email/colors.ts` (`emailColors.primary`, `emailColors.destructive`, etc.).

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

## Fin de session
Quand le contexte approche de la limite ou sur demande,
toujours créer/mettre à jour docs/session-handoff.md
avant de s'arrêter.

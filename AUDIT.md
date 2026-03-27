# Audit technique — Akom SaaS

> Généré le 2026-03-27. Couvre : sécurité multi-tenant, qualité TypeScript,
> architecture Next.js App Router, schéma Prisma et requêtes.

---

## Légende

| Symbole | Criticité |
|---------|-----------|
| 🔴 | Critique — exploitable ou bug avéré en production |
| 🟠 | Important — bug potentiel ou dégradation mesurable |
| 🟡 | Souhaitable — qualité, maintenabilité, scalabilité |

---

## 1. Problèmes critiques

### 1.1 Sécurité multi-tenant

---

#### 🔴 SEC-01 — Annulation de commande sans authentification

**Fichier :** `app/api/orders/[orderId]/cancel/route.ts:34`

**Problème :** Aucune authentification, aucune vérification tenant. N'importe qui
connaissant un UUID de commande peut l'annuler depuis internet.

**Correction :**
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

const order = await prisma.order.findUnique({ where: { id: orderId } })
if (!order) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

const member = await prisma.restaurantUser.findFirst({
  where: { userId: user.id, restaurantId: order.restaurantId },
})
if (!member) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
```

---

#### 🔴 SEC-02 — Lecture de commande via supabaseAdmin sans authentification

**Fichier :** `app/api/orders/[orderId]/route.ts:34`

**Problème :** Utilise le client `supabaseAdmin` (bypass RLS) sans aucun check
d'authentification. Toute commande est lisible publiquement par son UUID.

**Correction :** Ajouter `supabase.auth.getUser()` + vérification que l'`orderId`
appartient à un restaurant de l'utilisateur avant d'exécuter la requête.

---

#### 🔴 SEC-03 — Liste des commandes sans authentification

**Fichier :** `app/api/orders/route.ts:186`

**Problème :** `restaurantId` fourni librement en query string, sans auth.
L'historique complet des commandes de n'importe quelle structure est accessible.

**Correction :** Même pattern que SEC-01 — `getUser()` puis vérifier l'appartenance
au `restaurantId` demandé avant d'exécuter `prisma.order.findMany`.

---

#### 🔴 SEC-04 — Endpoint email d'invitation sans authentification

**Fichier :** `app/api/emails/invitation/route.ts:9`

**Problème :** POST sans auth. N'importe qui peut envoyer des emails au nom
d'Akôm (phishing, spam, coûts Resend).

**Correction :**
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
```

---

#### 🔴 SEC-05 — `getRestaurantOrders` sans vérification d'appartenance

**Fichier :** `lib/actions/order.ts:66`

**Problème :** Server Action acceptant un `restaurantId` arbitraire sans vérifier
que l'utilisateur appartient à cette structure.

**Correction :** Résoudre le restaurant depuis la session (`getCurrentUserAndRestaurant`)
au lieu d'accepter le paramètre en aveugle. Ou vérifier via
`prisma.restaurantUser.findFirst({ where: { userId, restaurantId } })`.

---

#### 🔴 SEC-06 — `getOrderDetails` et `getActiveOrdersForTable` sans auth ni filtre tenant

**Fichier :** `lib/actions/order.ts:86`

**Problème :** Lookup par `id` seul, sans authentification ni vérification du
tenant. Toute commande/table est lisible.

**Correction :** Ajouter `getUser()` + vérifier via `order.restaurantId` que
l'utilisateur appartient à la structure avant de retourner les données.

---

#### 🔴 SEC-07 — Actions abonnement sans vérification d'appartenance

**Fichier :** `lib/actions/subscription.ts:37`

**Problème :** `createManualPayment`, `getRestaurantSubscription`,
`getDaysRemaining`, `canAddUser`, `ensureSubscription`,
`getSubscriptionWithPayments` — acceptent un `restaurantId` en paramètre
sans jamais vérifier que l'appelant appartient à cette structure.

**Correction :** En début de chaque fonction :
```ts
const { user, restaurantId: currentRestaurantId } = await getCurrentUserAndRestaurant()
if (restaurantId !== currentRestaurantId) throw new Error('Accès refusé')
```

---

#### 🔴 SEC-08 — Pattern "check-then-act" : update sans `restaurantId`

**Fichiers :**
- `lib/actions/product.ts:401` — `toggleProductAvailability`
- `lib/actions/category.ts:179` — `toggleCategoryStatus`
- `lib/actions/family.ts:148` — `toggleFamilyStatus`
- `lib/actions/cash/close-session.ts:23`

**Problème :** Le `findUnique` vérifie `{ id, restaurantId }` mais le `update`
suivant n'utilise que `{ id }`. Non-atomique, contournable.

**Correction :** Inclure `restaurantId` dans le `where` de chaque `update` :
```ts
await prisma.product.update({
  where: { id, restaurantId },  // ← ajouter restaurantId
  data: { isAvailable: !product.isAvailable },
})
```

---

### 1.2 Bugs de données avérés

---

#### 🔴 BUG-01 — Calcul de revenu erroné dans `getTopProducts`

**Fichier :** `lib/actions/stats.ts:303`

**Problème :** `_sum.unitPrice` est la somme de tous les prix unitaires sur N
commandes, pas le prix unitaire. Multiplié par `_sum.quantity`, le revenu
affiché est gonflé d'un facteur N. Les statistiques "top produits" sont fausses.

```ts
// Actuel — faux
revenue: (item._sum.quantity || 0) * (item._sum.unitPrice || 0)

// Correct — récupérer unitPrice depuis la deuxième requête products
const productMap = new Map(products.map(p => [p.id, p]))
revenue: (item._sum.quantity || 0) * (productMap.get(item.productId)?.price ?? 0)
```

---

#### 🔴 BUG-02 — `lib/auth/session.ts` ignore le restaurant actif (multi-structures)

**Fichier :** `lib/auth/session.ts:33`

**Problème :** `getCurrentUserAndRestaurant()` fait `.single()` sans tenir compte
du cookie `akom_current_restaurant_id`. Un utilisateur gérant plusieurs structures
obtiendra toujours la première — le POS et la Caisse opèrent sur le mauvais tenant.

**Correction :** Lire le cookie dans cette fonction, exactement comme le layout :
```ts
const cookieStore = await cookies()
const savedId = cookieStore.get('akom_current_restaurant_id')?.value

const restaurantUser = await prisma.restaurantUser.findFirst({
  where: savedId
    ? { userId: user.id, restaurantId: savedId }
    : { userId: user.id },
  include: { restaurant: true },
})
```

---

#### 🔴 BUG-03 — Prisma importé dans un Client Component

**Fichier :** `app/test/page.tsx:5`

**Problème :** `'use client'` + `import prisma from '../../lib/prisma'`.
Expose les credentials DB dans le bundle navigateur, provoque une erreur de
build en production.

**Correction :** Supprimer ce fichier de test ou le convertir en Server Component.

---

#### 🔴 BUG-04 — Schéma Prisma `Subscription` désynchronisé du SQL

**Fichier :** `scripts/add-abonnement-table.sql` vs `prisma/schema.prisma`

**Problème :** Le script SQL crée des colonnes `monthly_price`, `max_tables`,
`max_users`, `has_stock_management`, `has_advanced_stats`… absentes du modèle
Prisma `Subscription`. La DB de production peut avoir des colonnes que Prisma
ignore.

**Correction :** Vérifier l'état réel de la table en production via
`npx prisma db pull` et synchroniser le schéma. Archiver ou supprimer les
scripts SQL obsolètes.

---

#### 🔴 BUG-05 — Deux scripts RLS contradictoires sur `subscriptions`

**Fichiers :** `scripts/add-abonnement-table.sql` vs `scripts/policy-abonnement.sql`

**Problème :** Le premier autorise les `authenticated` à faire des UPDATE sur
leurs abonnements. Le second restreint au `service_role` uniquement. Selon
l'ordre d'exécution, le comportement en production est imprévisible.

**Correction :** Conserver uniquement `policy-abonnement.sql` (version restrictive),
supprimer les policies conflictuelles de `add-abonnement-table.sql`, et
vérifier l'état actuel via le dashboard Supabase.

---

## 2. Problèmes importants

### 2.1 Sécurité — niveau important

---

#### 🟠 SEC-09 — `getActiveOrdersForTable` et `getOrderDetails` accessibles en lecture sans auth

**Fichier :** `lib/actions/order.ts:86–110`

**Problème :** Ces Server Actions sont utilisées depuis le menu public QR —
ce qui est légitime. Mais elles retournent des données sans vérifier que le
`tableId`/`orderId` appartient au restaurant du contexte.

**Correction :** Vérifier via la relation que la table/commande appartient au
restaurant du `slug` actif dans l'URL publique.

---

#### 🟠 SEC-10 — Middleware fail-open sur erreur réseau

**Fichier :** `middleware.ts:39,141,183`

**Problème :** Trois blocs `catch` retournent `supabaseResponse` (accès autorisé)
en cas d'erreur. Une panne Supabase laisse passer les abonnements expirés.

**Correction :**
```ts
} catch (err) {
  console.error('Middleware error:', err)
  return NextResponse.redirect(new URL('/login', request.url))
}
```

---

### 2.2 Performance — requêtes

---

#### 🟠 PERF-01 — `getActivityStats` : 14 requêtes SQL au lieu d'une

**Fichier :** `lib/actions/superadmin.ts:422`

**Problème :** 7 jours × (`order.count` + `order.aggregate`) = 14 requêtes
parallèles au lieu d'un seul `GROUP BY DATE`.

**Correction :**
```sql
SELECT DATE_TRUNC('day', created_at) as day,
       COUNT(*) as orders_count,
       SUM(total_amount) as revenue
FROM orders
WHERE restaurant_id = $1
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY day ORDER BY day
```
Via `prisma.$queryRaw`.

---

#### 🟠 PERF-02 — `getStockAlerts` : charge tous les stocks, filtre en JS

**Fichier :** `lib/actions/stats.ts:188`

**Problème :** Charge la totalité des stocks en mémoire pour filtrer
`quantity <= alertThreshold` en JS. O(N) en mémoire pour retourner 10 lignes.

**Correction :**
```sql
SELECT s.*, p.name, c.name as category_name
FROM stocks s
JOIN products p ON s.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE s.restaurant_id = $1
  AND s.quantity <= s.alert_threshold
ORDER BY s.quantity ASC
LIMIT 10
```

---

#### 🟠 PERF-03 — `getSalesByCategory` : charge tous les OrderItems, agrège en JS

**Fichier :** `lib/actions/stats.ts:317`

**Problème :** Charge l'intégralité des `OrderItem` de la période + produits +
catégories pour une agrégation manuelle via `Map` en JS. Critique sur volumes élevés.

**Correction :** Remplacer par `orderItem.groupBy` Prisma ou `$queryRaw` avec
`JOIN categories` + `GROUP BY category_id`.

---

#### 🟠 PERF-04 — N+1 dans `createPOSOrder` : 4 requêtes par article

**Fichier :** `app/(dashboard)/dashboard/pos/_actions/create-pos-order.ts:107`

**Problème :** La boucle `for (const item of payload.items)` exécute 4 requêtes
par article (`orderItem.create`, `stock.updateMany`, `stock.findFirst`,
`product.update`). Une commande de 5 articles = 20 requêtes.

**Correction :**
- Remplacer `orderItem.create` en boucle par `tx.orderItem.createMany` hors boucle
- Remplacer `stock.findFirst` par `stock.findUnique` sur la clé composée
  `@@unique([restaurantId, productId])` déjà définie dans le schéma

---

#### 🟠 PERF-05 — Requêtes séquentielles dans la page Caisse

**Fichier :** `app/(dashboard)/dashboard/caisse/page.tsx:33`

**Problème :** 3 requêtes Prisma indépendantes exécutées séquentiellement
(`todaySession`, `recentSessions`, `products`). Latence = somme des 3 au lieu
du max.

**Correction :**
```ts
const [todaySession, recentSessions, products] = await Promise.all([
  prisma.cashSession.findFirst(...),
  prisma.cashSession.findMany(...),
  prisma.product.findMany(...),
])
```

---

#### 🟠 PERF-06 — 2 requêtes séquentielles indépendantes dans le layout dashboard

**Fichier :** `app/(dashboard)/dashboard/layout.tsx:55`

**Problème :** `restaurantUser.findFirst` (restaurant courant) puis
`restaurantUser.findFirst` (première structure de l'admin) sont séquentiels
alors qu'ils sont indépendants.

**Correction :** `Promise.all([...])` sur les deux.

---

#### 🟠 PERF-07 — Double requête sur restaurant dans `generateMetadata`

**Fichier :** `app/(public)/r/[slug]/page.tsx:22,58`

**Problème :** `generateMetadata` et le composant page font chacun leur propre
`prisma.restaurant.findUnique({ where: { slug } })`.

**Correction :**
```ts
import { cache } from 'react'

const getRestaurantBySlug = cache(async (slug: string) =>
  prisma.restaurant.findUnique({ where: { slug, isActive: true }, select: {...} })
)
```
`cache()` déduplique automatiquement les appels identiques dans le même cycle de rendu.

---

#### 🟠 PERF-08 — Server Actions appelées dans `useEffect` (pas de SSR)

**Fichiers :**
- `app/(dashboard)/dashboard/page.tsx:36`
- `app/(dashboard)/dashboard/stats/page.tsx:33`
- `components/roles/RolesList.tsx:37`

**Problème :** Les données initiales sont chargées côté client après le montage
du composant. Aucun SSR, waterfall visible (page vide → données), `redirect()`
appelé côté client.

**Correction :** Convertir ces pages en Server Components. Isoler la partie
interactive (filtre de période) dans un Client Component enfant qui reçoit
les données via props depuis le SC parent.

---

#### 🟠 PERF-09 — Products et stocks sans pagination

**Fichiers :**
- `app/(dashboard)/dashboard/menu/products/page.tsx:52`
- `app/(dashboard)/dashboard/stocks/page.tsx`

**Problème :** `findMany` sans `take`/`skip`. Un restaurant avec 500+ produits
charge tout en mémoire à chaque visite.

**Correction :** Ajouter `take: 50, skip: offset` avec un composant de pagination,
ou une recherche côté serveur sur `name`.

---

#### 🟠 PERF-10 — `getWarehouseStats` : agrégation JS après full scan

**Fichier :** `lib/actions/warehouse.ts:391`

**Problème :** Charge tous les produits + stocks pour calculer `totalValue`,
`lowStockCount`, `criticalStockCount` via `reduce`/`filter` en JS.

**Correction :** Remplacer par des `prisma.warehouseStock.aggregate` et
`prisma.warehouseStock.count` avec les clauses `where` appropriées.

---

### 2.3 Bugs potentiels — schéma et relations

---

#### 🟠 SCH-01 — `OrderItem → Product` : RESTRICT implicite

**Fichier :** `prisma/schema.prisma` — relation `OrderItem.product`

**Problème :** Aucun `onDelete` défini → RESTRICT par défaut. Supprimer un
produit ayant des `OrderItem` dans l'historique lève une erreur. Ce comportement
n'est pas documenté et peut surprendre.

**Correction :** Décider explicitement : soit `onDelete: Restrict` documenté,
soit `onDelete: SetNull` avec `productId String?` pour préserver l'historique
avec une référence nulle.

---

#### 🟠 SCH-02 — `WarehouseToOpsTransfer → Product` : Cascade efface l'historique

**Fichier :** `prisma/schema.prisma` — relation `WarehouseToOpsTransfer.opsProduct`

**Problème :** `onDelete: Cascade` sur les transferts entrepôt → suppression
d'un produit opérationnel efface l'audit trail des transferts.

**Correction :** Changer en `onDelete: SetNull` avec `opsProductId String?`.

---

#### 🟠 SCH-03 — `Stock.findFirst` au lieu de `findUnique` sur clé composée existante

**Fichiers :**
- `lib/actions/cash/add-revenue.ts`
- `lib/actions/cash/add-expense.ts`

**Problème :** `prisma.stock.findFirst({ where: { productId, restaurantId } })`
ignore la contrainte `@@unique([restaurantId, productId])` déjà définie.
`findUnique` est plus sûr, sémantiquement correct, et potentiellement plus rapide.

**Correction :**
```ts
const stock = await tx.stock.findUnique({
  where: { restaurantId_productId: { restaurantId, productId } },
})
```

---

### 2.4 Qualité TypeScript — bugs potentiels

---

#### 🟠 TS-01 — `UserRole` dupliqué par rapport à l'enum Prisma

**Fichier :** `types/auth.ts:5`

**Problème :** `export type UserRole = 'admin' | 'cashier' | 'kitchen'` duplique
`UserRole` de `@prisma/client`. Si un rôle est ajouté au schéma, le type manuel
ne se met pas à jour automatiquement → divergence silencieuse.

**Correction :**
```ts
import type { UserRole } from '@prisma/client'
export type { UserRole }
```
Même correction pour `OrderStatus` dans `types/stats.ts`.

---

#### 🟠 TS-02 — `as unknown as PaymentMethod` dans `create-pos-order`

**Fichier :** `app/(dashboard)/dashboard/pos/_actions/create-pos-order.ts:98`

**Problème :** Cast dangereux car `POSPaymentMethod` et `PaymentMethod` Prisma
ne se chevauchent pas formellement. Si une valeur est ajoutée à l'un sans
l'autre, le cast silencieux produit une valeur invalide en DB.

**Correction :**
```ts
const PAYMENT_METHOD_MAP: Record<POSPaymentMethod, PaymentMethod> = {
  cash: PaymentMethod.cash,
  airtel_money: PaymentMethod.airtel_money,
  moov_money: PaymentMethod.moov_money,
}
method: isPayNow ? PAYMENT_METHOD_MAP[payload.paymentMethod!] : PaymentMethod.cash
```

---

#### 🟠 TS-03 — `RestaurantWithRole.subscription.plan` typé `string` au lieu de l'enum

**Fichier :** `types/auth.ts:23`

**Problème :** `subscription?: { plan: string; status: string } | null` force
des `as any` en cascade dans `FeatureGate`, `RestaurantSwitcher`,
`subscription/expired/page.tsx`. Source de 4+ casts inutiles.

**Correction :**
```ts
import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
subscription?: { plan: SubscriptionPlan; status: SubscriptionStatus } | null
```

---

#### 🟠 TS-04 — `PaymentCard` typé `payment: any`

**Fichier :** `app/(dashboard)/superadmin/payments/PaymentCard.tsx:41`

**Problème :** Toute la logique `payment.subscription.plan`,
`payment.restaurant.name`, `payment.proofUrl` est non vérifiée par le
compilateur.

**Correction :**
```ts
import type { Prisma } from '@prisma/client'
type SubscriptionPaymentFull = Prisma.SubscriptionPaymentGetPayload<{
  include: { subscription: true; restaurant: true }
}>
interface PaymentCardProps { payment: SubscriptionPaymentFull }
```

---

#### 🟠 TS-05 — Types locaux dupliqués et déjà divergents dans superadmin

**Fichier :** `app/(dashboard)/superadmin/restaurants/[id]/page.tsx:23`

**Problème :** `RestaurantDetailsType` et `RestaurantUserType` dupliquent
`types/restaurant.ts`. `RestaurantUserType.role: string` a déjà divergé de
`RestaurantUser.role: UserRole | null`.

**Correction :** Supprimer les types locaux, importer depuis `types/restaurant.ts`.

---

#### 🟠 TS-06 — `MonthlyStats = any[]` dans superadmin stats

**Fichier :** `app/(dashboard)/superadmin/stats/page.tsx:30`

**Correction :**
```ts
type MonthlyStats = Awaited<ReturnType<typeof getStatsByPeriod>>
```

---

## 3. Améliorations souhaitables

### 3.1 Infrastructure Next.js

---

#### 🟡 INFRA-01 — Aucun `loading.tsx` dans tout le projet

**Problème :** Chaque navigation bloque l'UI jusqu'à la fin de toutes les
requêtes Prisma du layout + de la page. Aucun skeleton affiché.

**Correction :** Créer au minimum :
```
app/(dashboard)/dashboard/loading.tsx
app/(dashboard)/dashboard/menu/categories/loading.tsx
app/(dashboard)/dashboard/menu/products/loading.tsx
app/(dashboard)/dashboard/stats/loading.tsx
app/(dashboard)/superadmin/loading.tsx
```

---

#### 🟡 INFRA-02 — Aucun `error.tsx` dans tout le projet

**Problème :** Une erreur Prisma/Supabase non catchée affiche la page d'erreur
générique Next.js sans possibilité de récupération.

**Correction :** Créer au minimum :
```
app/(dashboard)/dashboard/error.tsx
app/(dashboard)/superadmin/error.tsx
app/(public)/r/[slug]/error.tsx
```

---

#### 🟡 INFRA-03 — Aucun `next/dynamic` sur les composants de charts

**Problème :** `RevenueChart`, `CategorySalesChart`, `TopProductsChart`,
`OrdersDistributionChart` (recharts) sont importés statiquement. Ils
alourdissent le bundle initial sans être utiles au-dessus de la fold.

**Correction :**
```ts
const RevenueChart = dynamic(() => import('@/components/stats/revenue-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
})
```

---

#### 🟡 INFRA-04 — `DashboardProvider` défini mais jamais utilisé

**Fichier :** `components/providers/dashboard-provider.tsx`

**Problème :** Code mort — le layout utilise `RestaurantProvider` à la place.

**Correction :** Supprimer le fichier ou l'intégrer dans le layout si
pertinent.

---

### 3.2 Schéma Prisma — index manquants

---

#### 🟡 IDX-01 — `Category` sans aucun `@@index`

**Fichier :** `prisma/schema.prisma` — modèle `Category`

**Correction :**
```prisma
@@index([restaurantId])
@@index([restaurantId, isActive])
@@index([restaurantId, position])
```

---

#### 🟡 IDX-02 — `RestaurantUser` — `restaurantId` non indexé

**Correction :**
```prisma
@@index([restaurantId])  // en plus du @@index([userId]) existant
```

---

#### 🟡 IDX-03 — `OrderItem` — `productId` non indexé

**Correction :**
```prisma
@@index([productId])
```

---

#### 🟡 IDX-04 — `Payment` — index composite manquant

**Correction :**
```prisma
@@index([restaurantId, status])
@@index([restaurantId, createdAt])
```

---

#### 🟡 IDX-05 — `ManualRevenue` et `Expense` — `revenueDate`/`expenseDate` non indexés

**Correction :**
```prisma
// ManualRevenue
@@index([restaurantId, revenueDate])

// Expense
@@index([restaurantId, expenseDate])
```

---

#### 🟡 IDX-06 — `WarehouseMovement` — index `createdAt` seul peu sélectif

**Correction :**
```prisma
// Remplacer @@index([createdAt]) par :
@@index([restaurantId, createdAt])
```

---

#### 🟡 IDX-07 — `CashSession` — `status` non indexé

**Correction :**
```prisma
@@index([restaurantId, status])
```

---

### 3.3 Schéma Prisma — contraintes manquantes

---

#### 🟡 SCH-04 — `Category` sans contrainte d'unicité sur le nom

**Correction :**
```prisma
@@unique([restaurantId, name])
```

---

#### 🟡 SCH-05 — `WarehouseProduct.sku` sans contrainte d'unicité

**Correction :** Index partiel (non supporté nativement par Prisma) via migration
SQL :
```sql
CREATE UNIQUE INDEX warehouse_products_restaurant_sku_unique
ON warehouse_products (restaurant_id, sku)
WHERE sku IS NOT NULL;
```

---

#### 🟡 SCH-06 — `WarehouseProduct.category` en `String?` libre

**Problème :** `getWarehouseCategories` fait un `distinct` — `"Boissons"` et
`"boissons"` coexistent. Pas de contrainte d'intégrité.

**Correction :** Normaliser via une table `WarehouseCategory` ou, à minima,
valider la casse côté applicatif (`.toLowerCase().trim()`) à la création.

---

### 3.4 Timestamps manquants

---

#### 🟡 SCH-07 — `OrderItem` sans timestamps

**Problème :** Impossible d'auditer quand un item a été ajouté ou modifié.

**Correction :**
```prisma
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @updatedAt @map("updated_at")
```

---

#### 🟡 SCH-08 — `RestaurantUser` sans `updatedAt`

**Problème :** Impossible de savoir quand un rôle a été modifié.

**Correction :**
```prisma
updatedAt DateTime @updatedAt @map("updated_at")
```

---

#### 🟡 SCH-09 — `Stock` sans `createdAt`

**Correction :**
```prisma
createdAt DateTime @default(now()) @map("created_at")
```

---

#### 🟡 SCH-10 — `ManualRevenue` et `Expense` sans `updatedAt`

**Correction :**
```prisma
updatedAt DateTime @updatedAt @map("updated_at")
```

---

### 3.5 Qualité TypeScript — améliorations

---

#### 🟡 TS-07 — Pas de type `ActionResult<T>` global partagé

**Problème :** Chaque module invente sa propre shape de retour :
`{ success, error }`, `{ success, message }`, `{ success, data, quotaExceeded }`.
Impossible de typer les consommateurs de façon cohérente.

**Correction :** Créer `types/actions.ts` :
```ts
export type ActionSuccess<T = void> = T extends void
  ? { success: true; message?: string }
  : { success: true; data: T; message?: string }
export type ActionError = { success: false; error: string }
export type ActionResult<T = void> = ActionSuccess<T> | ActionError
```

---

#### 🟡 TS-08 — `as any` inutiles sur `RestaurantWithRole`

**Fichiers :**
- `components/dashboard/RestaurantSwitcher.tsx:132,169,187,203`
- `components/subscription/FeatureGate.tsx:37`
- `app/(dashboard)/dashboard/page.tsx:34`
- `app/(dashboard)/dashboard/orders/page.tsx:29`

**Problème :** `(x as any).activityType` et `(x as any).subscription` —
ces propriétés existent déjà sur `RestaurantWithRole`.

**Correction :** Supprimer tous ces casts. Corriger TS-03 en amont résout la
majorité.

---

#### 🟡 TS-09 — `(window as any).gtag/fbq` dans CookieConsent

**Fichier :** `components/gdpr/CookieConsent.tsx:320`

**Correction :**
```ts
declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void
    fbq?: (command: string, ...args: unknown[]) => void
  }
}
```

---

#### 🟡 TS-10 — `catch (e: any)` dans 6 fichiers

**Fichiers :**
- `dashboard/caisse/_components/expenses/AddExpenseForm.tsx:104`
- `dashboard/caisse/_components/revenues/AddRevenueForm.tsx:99`
- `dashboard/caisse/_components/OpenSessionCard.tsx:56`
- `app/(public)/r/[slug]/t/[number]/cart-dialog.tsx:91`
- `app/(public)/r/[slug]/t/[number]/orders/[orderId]/page.tsx:149`
- `components/auth/SignOutButton.tsx:47`

**Correction :**
```ts
} catch (e) {
  const message = e instanceof Error ? e.message : 'Erreur inconnue'
  toast.error(message)
}
```

---

#### 🟡 TS-11 — `lib/serialize.ts` entièrement typé `any`

**Fichier :** `lib/serialize.ts:2,6,23,43,56`

**Correction :**
```ts
export function isDecimalLike(v: unknown): boolean
export function deepSerialize<T>(obj: T): unknown
export function serializeWarehouseProduct(product: unknown): SerializedWarehouseProduct
```

---

#### 🟡 TS-12 — `$queryRaw<any[]>` dans `getSupportStats`

**Fichier :** `lib/actions/support.ts:90`

**Correction :**
```ts
interface SupportStatsRow {
  total: number; open: number; in_progress: number
  resolved: number; avg_hours: number
}
const stats = await prisma.$queryRaw<SupportStatsRow[]>`...`
```

---

#### 🟡 TS-13 — `whereConditions: any` dans warehouse

**Fichier :** `lib/actions/warehouse.ts:446`

**Correction :**
```ts
const whereConditions: Prisma.WarehouseProductWhereInput = { restaurantId, isActive: true }
```

---

#### 🟡 TS-14 — Hook `use-realtime-orders.ts` inutilisé avec des `any`

**Fichier :** `lib/hooks/use-realtime-orders.ts`

**Problème :** Marqué `// !!!!! PAS UTILISE !!!!!` en commentaire, contient
plusieurs `(order: any)`.

**Correction :** Supprimer le fichier.

---

### 3.6 RLS Supabase — couverture partielle

---

#### 🟡 RLS-01 — Tables critiques sans RLS

**Problème :** Sur ~20 tables avec `restaurantId`, seulement 5 ont du RLS.
Les tables `orders`, `payments`, `products`, `stocks`, `cash_sessions`,
`expenses` n'ont aucune politique Supabase. Un accès direct via le dashboard
Supabase ou `psql` ne bénéficie d'aucune protection tenant.

**Correction recommandée :** Ajouter des politiques RLS restrictives sur les
tables les plus sensibles. Minima suggéré :
```sql
-- Pour toutes les tables avec restaurant_id
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON orders
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
  ));
```
Note : ces politiques ne sont actives que pour les connexions `authenticated`.
Le client Prisma avec `service_role` les bypass — la sécurité applicative
reste la ligne principale.

---

## Récapitulatif

| Catégorie | Critique 🔴 | Important 🟠 | Souhaitable 🟡 |
|-----------|-------------|--------------|----------------|
| Sécurité multi-tenant | 8 | 2 | 1 |
| Bugs de données | 5 | — | — |
| Performance requêtes | — | 10 | — |
| Schéma Prisma | — | 3 | 10 |
| TypeScript | — | 6 | 8 |
| Infrastructure Next.js | — | 1 | 4 |
| **Total** | **13** | **22** | **23** |

### Ordre de traitement recommandé

1. **SEC-01 à SEC-04** — Routes API sans auth (exploitables depuis internet)
2. **BUG-01** — Calcul de revenu erroné (données corrompues en production)
3. **BUG-02** — `session.ts` ignore le restaurant actif (bug multi-structures)
4. **BUG-03** — Prisma dans Client Component (build brisé)
5. **BUG-04 / BUG-05** — Désynchronisation schéma SQL/Prisma
6. **SEC-05 à SEC-08** — Vérifications tenant manquantes dans les actions
7. **PERF-01 à PERF-04** — Requêtes critiques (14 SQL → 1, N+1 POS)
8. **TS-01 à TS-06** — Types incorrects avec risque de divergence
9. **INFRA-01 / INFRA-02** — `loading.tsx` + `error.tsx`
10. Le reste par opportunité lors des développements futurs

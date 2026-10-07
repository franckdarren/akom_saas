# Intégrer SingPay — procédure d'implémentation

Procédure complète pour intégrer l'agrégateur de paiement **SingPay** (Airtel Money,
Moov Money — Gabon) dans une application Next.js App Router + Prisma.

Écrite à partir de l'intégration d'Akôm, retours d'expérience et pièges compris.
Stack de référence : Next.js 16 (App Router), Prisma 7, PostgreSQL. Les principes
(ordre des opérations, sécurité, résolution par référence) sont transposables à
n'importe quelle stack.

---

## 0. Avant d'écrire une ligne de code

SingPay expose **deux mécanismes de paiement distincts**, et c'est le point le plus
important de tout ce document :

| Mécanisme | Endpoint | Expérience | Activation |
|---|---|---|---|
| **USSD Push** | `POST /74/paiement` (Airtel)<br>`POST /62/paiement` (Moov) | Notification directe sur le téléphone du client, il saisit son code PIN | **Souvent à activer commercialement** |
| **Page hébergée** | `POST /ext` | Redirection vers une page de paiement SingPay | Généralement actif par défaut |

> ⚠️ **À vérifier auprès de SingPay AVANT de développer** : le paiement direct
> (USSD Push) est-il ouvert sur votre wallet ? Sur Akôm, `/ext` fonctionne
> parfaitement pendant que `/74/paiement` renvoie systématiquement
> `status.success = false` avec le message générique « Something went wrong »,
> avec les mêmes credentials et le même wallet. Des semaines peuvent se perdre à
> déboguer du code qui n'a jamais été le problème.

**Questions à poser à SingPay au moment de l'ouverture du compte :**

1. Le paiement direct (USSD Push) est-il activé sur mon wallet, ou seulement `/ext` ?
2. Le champ `disbursement` est-il obligatoire pour le push ? Pour `/ext` ?
3. Quel format exact pour `client_msisdn` : `24177123456` ou `241077123456` (le `0` national se conserve-t-il) ?
4. Quelle est la forme exacte de la réponse de `GET /transaction/api/search/by-reference/{ref}` ?
5. Les callbacks sont-ils envoyés pour les paiements initiés via `/ext` ?

Les points 3 et 4 ne sont pas documentés clairement dans le Swagger. Les faire
confirmer par écrit évite deux des trois bugs classiques de cette intégration.

---

## 1. Variables d'environnement

```bash
SINGPAY_BASE_URL=https://gateway.singpay.ga/v1
SINGPAY_CLIENT_ID=...          # global à la plateforme
SINGPAY_CLIENT_SECRET=...      # global à la plateforme
SINGPAY_WALLET_ID=...          # wallet qui reçoit les fonds
SINGPAY_DISBURSEMENT_ID=...    # redirige les fonds — obligatoire en production
NEXT_PUBLIC_APP_URL=https://…  # construction des callbacks et redirections
```

**Modèle d'authentification à comprendre** : `clientId` / `clientSecret` sont
**globaux** à la plateforme, seul le **wallet** varie. C'est ce qui permet, dans une
application multi-tenant, que chaque marchand reçoive ses fonds sur son propre
portefeuille SingPay **sans jamais détenir de clés API**. Le wallet voyage dans le
header `x-wallet` de chaque requête.

> ⚠️ Si `SINGPAY_DISBURSEMENT_ID` est absent, `JSON.stringify` supprime purement la
> clé du body. `/ext` peut le tolérer alors que le push le rejette — panne
> silencieuse et asymétrique, très difficile à diagnostiquer.

---

## 2. Modèle de données

Le minimum vital sur la table des paiements :

```prisma
model Payment {
  id     String @id @default(uuid())
  amount Int    // FCFA, entier — jamais de décimales
  status PaymentStatus // pending | paid | failed | refunded

  // --- SingPay ---
  singpayReference     String?  @unique  // ← INDISPENSABLE et UNIQUE
  singpayTransactionId String?
  singpayStatus        String?
  singpayResult        String?
  phoneNumber          String?
  errorMessage         String?

  // --- Callback ---
  callbackReceived Boolean   @default(false)  // ← idempotence
  callbackData     Json?
  callbackAt       DateTime?
  paidAt           DateTime?

  @@index([singpayReference])
}
```

Trois colonnes portent toute la robustesse de l'intégration :

- **`singpayReference` unique** — c'est votre clé de corrélation. Le webhook ne
  reçoit rien d'autre d'exploitable pour retrouver le paiement. L'unicité vous
  protège aussi des doubles traitements en base.
- **`callbackReceived`** — l'idempotence. SingPay peut rejouer un callback.
- **`singpayTransactionId`** — nullable, et il le restera pour les paiements `/ext`
  (voir §5, le piège central).

---

## 3. Constantes et types

`lib/singpay/constants.ts` :

```ts
export const SINGPAY_CONFIG = {
  baseUrl: process.env.SINGPAY_BASE_URL || 'https://gateway.singpay.ga/v1',
  clientId: process.env.SINGPAY_CLIENT_ID!,
  clientSecret: process.env.SINGPAY_CLIENT_SECRET!,
  walletId: process.env.SINGPAY_WALLET_ID!,
  disbursementId: process.env.SINGPAY_DISBURSEMENT_ID!,

  requestTimeout: 30_000,
  extRequestTimeout: 60_000,   // /ext est nettement plus lent
  statusCheckInterval: 5_000,
  maxStatusChecks: 24,         // 2 minutes
} as const

export const SINGPAY_ENDPOINTS = {
  airtelPayment: '/74/paiement',
  moovPayment: '/62/paiement',
  transactionStatus: (id: string) => `/transaction/api/status/${id}`,
  transactionByReference: (ref: string) =>
    `/transaction/api/search/by-reference/${ref}`,
  externalPayment: '/ext',
} as const
```

`lib/singpay/types.ts` :

```ts
export interface SingpayPaymentRequest {
  amount: number
  reference: string
  client_msisdn: string
  portefeuille: string        // = walletId
  disbursement?: string
  isTransfer?: boolean
}

export interface SingpayTransaction {
  status: string   // 'Start' | 'Partenaire' | 'Terminate' | 'Disbursement' | 'Refund'
  result?: string  // 'Success' | 'PasswordError' | 'BalanceError' | 'TimeOutError' | 'Error'
  id: string       // identifiant SingPay de la transaction
  _id: string
  reference: string // NOTRE référence
  amount: string    // ⚠️ string, pas number
  client_msisdn: string
  airtel_money_id?: string
  created_at: string
  updated_at: string
}

export interface SingpayPaymentResponse {
  transaction: SingpayTransaction
  status: {
    code: string
    message: string
    success: boolean
    result_code?: string
  }
}

export interface SingpayExtRequest {
  portefeuille: string
  reference: string
  amount: number
  redirect_success: string
  redirect_error: string
  disbursement?: string
  isTransfer?: boolean
}

export interface SingpayExtResponse {
  link: string
  exp: string
}
```

> ⚠️ `transaction.amount` est une **chaîne**. Toujours `parseInt(…, 10)` avant de
> comparer au montant attendu, sinon la validation anti-fraude ne compare rien.

---

## 4. Le client HTTP

`lib/singpay/client.ts` — aucune dépendance, `fetch` natif suffit :

```ts
class SingpayClient {
  private getHeaders(walletId: string): Record<string, string> {
    return {
      'x-client-id': SINGPAY_CONFIG.clientId,
      'x-client-secret': SINGPAY_CONFIG.clientSecret,
      'x-wallet': walletId,
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit,
    walletId: string,
    timeout = SINGPAY_CONFIG.requestTimeout,
  ): Promise<T> {
    const response = await fetch(`${SINGPAY_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      headers: this.getHeaders(walletId),
      signal: AbortSignal.timeout(timeout),
    })

    if (!response.ok) {
      throw new Error(`SingPay API Error (${response.status}): ${await response.text()}`)
    }
    return response.json() as Promise<T>
  }

  // initiateAirtelPayment / initiateMoovPayment / getTransactionStatus
  // getExternalPaymentLink (timeout étendu) / getTransactionByReference
}

export const singpayClient = new SingpayClient()
```

**Distinguer deux natures d'échec** — cette distinction est votre outil de
diagnostic principal :

| Symptôme | Signification |
|---|---|
| Exception `SingPay API Error (401/403)` | Credentials ou droits invalides |
| Réponse HTTP 200 avec `status.success === false` | **Credentials valides**, refus applicatif |

Le second cas prouve que l'authentification passe et déplace l'enquête vers le
métier (droits sur l'endpoint, disbursement, msisdn).

> ⚠️ **Ne typez pas `getTransactionByReference` comme `SingpayTransaction`.** La
> forme de sa réponse n'est pas garantie. Retournez `unknown` et normalisez (§5).

---

## 5. Le résolveur de transaction — la pièce que tout le monde oublie

**Le piège central de cette intégration :** `POST /ext` **ne retourne pas de
`transactionId`**, seulement un lien. Si votre webhook et votre polling exigent un
`transactionId` pour vérifier, alors **aucun paiement passé par la page hébergée ne
sera jamais confirmé**. Sur Akôm, cela a représenté 100 % des paiements pendant des
mois : tous validés à la main, un resté bloqué en `pending` définitivement.

La parade : résoudre par **référence** quand l'ID est absent.

`lib/singpay/resolve-transaction.ts` :

```ts
export interface ResolvedTransaction {
  transaction: SingpayTransaction
  resolvedByReference: boolean
}

function isSingpayTransaction(value: unknown): value is SingpayTransaction {
  if (typeof value !== 'object' || value === null) return false
  const c = value as Record<string, unknown>
  return typeof c.status === 'string' && typeof c.reference === 'string'
}

/** La réponse peut être brute, enveloppée dans { transaction } ou une liste. */
function normalizeByReference(payload: unknown): SingpayTransaction | null {
  if (isSingpayTransaction(payload)) return payload
  if (Array.isArray(payload)) return payload.find(isSingpayTransaction) ?? null

  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>
    if (isSingpayTransaction(record.transaction)) return record.transaction
    if (record.data !== undefined) return normalizeByReference(record.data)
  }
  return null
}

export async function resolveSingpayTransaction(params: {
  transactionId?: string | null
  reference?: string | null
  walletId: string
}): Promise<ResolvedTransaction | null> {
  const { transactionId, reference, walletId } = params

  if (transactionId) {
    const result = await singpayClient.getTransactionStatus(transactionId, walletId)
    if (!result.status.success || !isSingpayTransaction(result.transaction)) return null
    return { transaction: result.transaction, resolvedByReference: false }
  }

  if (!reference) return null

  const payload = await singpayClient.getTransactionByReference(reference, walletId)
  const transaction = normalizeByReference(payload)
  return transaction ? { transaction, resolvedByReference: true } : null
}
```

**Règles d'usage :**

- Faire passer **tous** les points de vérification par ce résolveur : webhook,
  route de polling, server actions. Aucun ne doit appeler `getTransactionStatus`
  directement.
- `null` signifie « SingPay ne connaît pas cette transaction » → laisser en
  `pending`. Jamais `failed` : le client n'a peut-être simplement pas encore payé.
- Quand `resolvedByReference` est vrai, **persister l'ID découvert** pour que les
  vérifications suivantes empruntent le chemin normal.

---

## 6. Utilitaires

```ts
/** Référence unique. Préfixer par domaine permet de router les callbacks. */
export function generateReference(scope: string, tenantId: string): string {
  const shortId = tenantId.substring(0, 8)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `APP-${scope}-${shortId}-${Date.now()}-${random}`
}

/** Statut SingPay → statut applicatif. Seul 'Terminate' est final côté succès. */
export function mapSingpayToPaymentStatus(status: string, result?: string) {
  if (status === 'Terminate') return result === 'Success' ? 'paid' : 'failed'
  if (status === 'Refund') return 'refunded'
  return 'pending'
}

/**
 * SingPay renvoie souvent « Something went wrong » : seuls code et result_code
 * identifient la cause réelle. Ne JAMAIS stocker le message seul.
 */
export function formatSingpayError(status: {
  code?: string
  message?: string
  result_code?: string
}): string {
  const message = status.message?.trim() || 'Refus SingPay sans message'
  const details = [
    status.code ? `code=${status.code}` : null,
    status.result_code ? `result_code=${status.result_code}` : null,
  ].filter((p): p is string => p !== null).join(' ')

  return details ? `${message} (${details})` : message
}
```

**Formatage du numéro** — le point à faire confirmer par SingPay :

```ts
export function formatPhoneForSingpay(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1)

  // Numéro national gabonais (09 chiffres, commence par 0)
  // ⚠️ Le 0 se conserve-t-il après l'indicatif ? À CONFIRMER avec SingPay.
  //    241 + 077123456 = 241077123456  (12 chiffres)
  //    241 +  77123456 =  24177123456  (11 chiffres, E.164 standard)
  if (cleaned.startsWith('0')) cleaned = '241' + cleaned
  else if (!cleaned.startsWith('241')) cleaned = '241' + cleaned

  if (cleaned.length < 11) throw new Error('Numéro de téléphone invalide')
  return cleaned
}
```

> Sur Akôm, les deux variantes ont été testées et rejetées identiquement — le
> format n'était donc pas la cause de la panne. Écrire un test des deux formats
> dès le premier jour fait gagner beaucoup de temps.

**Préfixes opérateurs (Gabon)** : `074 / 076 / 077` → Airtel (`/74/paiement`),
`062 / 065 / 066` → Moov (`/62/paiement`). Valider la cohérence entre l'opérateur
choisi et le préfixe saisi **avant** d'appeler l'API : un numéro Airtel envoyé sur
l'endpoint Moov est rejeté, et l'erreur est peu parlante.

---

## 7. Initier un paiement

Ordre des opérations **non négociable** :

```ts
export async function initiatePayment(params) {
  // 1. Garde anti-doublon : un paiement pending/paid existe déjà ?
  //    Sinon on empile les tentatives et on encaisse deux fois.

  // 2. Formater le numéro (peut lever)

  // 3. Générer la référence unique

  // 4. ⚠️ CRÉER LE PAYMENT EN BASE **AVANT** L'APPEL RÉSEAU
  //    Si l'appel réussit mais que le process meurt avant l'insert, le client
  //    est débité sans trace. Toujours écrire d'abord, appeler ensuite.
  const payment = await prisma.payment.create({
    data: { amount, status: 'pending', singpayReference: reference, ... },
  })

  // 5. Appeler SingPay
  let result
  try {
    result = operator === 'airtel'
      ? await singpayClient.initiateAirtelPayment(body)
      : await singpayClient.initiateMoovPayment(body)
  } catch (error) {
    console.error('[SINGPAY] Exception appel API:', error)
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed', errorMessage: String(error) },
    })
    return { error: 'Impossible de contacter le service de paiement.' }
  }

  // 6. Refus applicatif → journaliser le CONTEXTE COMPLET
  if (!result.status.success) {
    const detailedError = formatSingpayError(result.status)
    console.error('[SINGPAY] Paiement refusé:', {
      reference,
      endpoint: operator === 'airtel' ? '/74/paiement' : '/62/paiement',
      msisdn: formattedPhone,
      wallet: walletId,
      disbursementFourni: Boolean(disbursementId),
      status: result.status,          // ← code + result_code, la clé du diagnostic
    })
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed', errorMessage: detailedError },
    })
    return { error: detailedError }
  }

  // 7. Mémoriser l'ID de transaction
  await prisma.payment.update({
    where: { id: payment.id },
    data: { singpayTransactionId: result.transaction.id },
  })

  return { success: true, paymentId: payment.id }
}
```

**Le fallback `/ext`** quand le push échoue :

```ts
const result = await singpayClient.getExternalPaymentLink({
  portefeuille: walletId,
  reference,                                   // même schéma de référence
  amount,
  redirect_success: `${appUrl}/…?payment=success`,
  redirect_error: `${appUrl}/…?payment=error`,
  disbursement: disbursementId,
  isTransfer: false,
})
```

> ⚠️ **Ne jamais basculer sur `/ext` en silence.** Une bascule muette masque
> l'erreur réelle : l'utilisateur voit « ça marche » et vous ne saurez jamais
> pourquoi le push échoue. Journaliser systématiquement, et afficher à
> l'utilisateur que le mode de paiement a changé.

---

## 8. Confirmer un paiement : le webhook

**Règle absolue : le body du callback n'est jamais une source de vérité.** Il
n'est qu'un déclencheur. Sans re-vérification, n'importe qui peut forger un POST
`status=Terminate, result=Success` et valider une commande sans avoir payé.

```ts
export async function POST(request, { params }) {
  const callbackData = await request.json()

  // 1. Retrouver le paiement par NOTRE référence
  const payment = await prisma.payment.findUnique({
    where: { singpayReference: callbackData.transaction.reference },
  })
  if (!payment) return json({ error: 'Payment not found' }, 404)

  // 2. Cloisonnement multi-tenant : le tenant de l'URL correspond-il ?
  if (payment.tenantId !== params.tenantId) return json({ error: 'Unauthorized' }, 403)

  // 3. Idempotence — SingPay peut rejouer le callback
  if (payment.callbackReceived) return json({ success: true, message: 'Already processed' })

  // 4. ⚠️ RE-VÉRIFIER AUPRÈS DE SINGPAY (source autoritative)
  let resolved
  try {
    resolved = await resolveSingpayTransaction({
      transactionId: payment.singpayTransactionId,
      reference: payment.singpayReference,   // ← indispensable pour les paiements /ext
      walletId,
    })
  } catch {
    return json({ error: 'Verification failed' }, 503)   // fail-closed
  }
  if (!resolved) return json({ error: 'Verification rejected' }, 400)

  const tx = resolved.transaction   // ← à partir d'ici, PLUS RIEN du body

  // 5. Cohérence référence + montant, contre la réponse autoritative
  if (tx.reference !== payment.singpayReference) return json({ error: 'Reference mismatch' }, 400)

  const verifiedAmount = parseInt(tx.amount, 10)   // amount est une string
  if (!isNaN(verifiedAmount) && verifiedAmount !== payment.amount) {
    return json({ error: 'Amount mismatch' }, 400)
  }

  // 6. Appliquer l'état + effets métier (stock, notifications, activation…)
  const newStatus = mapSingpayToPaymentStatus(tx.status, tx.result)
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      callbackReceived: true,
      callbackData: JSON.parse(JSON.stringify(callbackData)),
      callbackAt: new Date(),
      ...(resolved.resolvedByReference && tx.id ? { singpayTransactionId: tx.id } : {}),
      ...(newStatus === 'paid' && { paidAt: new Date() }),
    },
  })

  return json({ success: true })
}
```

**URL de callback** : la déclarer côté SingPay (SingPay Workspace, détail du
portefeuille). En multi-tenant, inclure l'identifiant dans le chemin —
`/api/webhooks/singpay/{tenantId}` — et le vérifier contre le paiement (étape 2).
Prévoir un webhook distinct par domaine fonctionnel (commandes vs abonnements) et
router grâce au préfixe de référence.

---

## 9. Le polling client — filet de sécurité indispensable

Ne dépendez jamais du seul webhook : il peut ne pas être configuré, ne pas être
émis pour `/ext`, ou échouer. Le client doit interroger une route de statut.

```
GET /api/payments/{id}/status  →  { status, isPaid, isFailed, errorMessage? }
```

Comportement attendu :

1. Statut déjà final en base → répondre immédiatement, sans appeler SingPay.
2. Sinon `resolveSingpayTransaction({ transactionId, reference, walletId })`.
3. `null` → répondre `pending` (surtout pas `failed`).
4. Sinon appliquer le statut, persister l'ID découvert, déclencher les effets métier.

Côté composant : intervalle 5 s, plafond 24 essais (2 min), puis un état
« délai dépassé » avec un bouton « Vérifier à nouveau ». Ne jamais boucler
indéfiniment.

**Cas `/ext`** : ouvrir la page de paiement dans un **nouvel onglet**
(`target="_blank"`) et basculer l'onglet d'origine en mode suivi au clic. Le
paiement se confirme alors automatiquement même sans webhook :

```tsx
<a href={extLink} target="_blank" rel="noopener noreferrer"
   onClick={() => setTrackingPaymentId(extPaymentId)}>
  Payer
</a>
```

**Effets métier idempotents** : webhook et polling peuvent confirmer le même
paiement en parallèle. Décrémenter un stock ou activer un abonnement doit
supporter d'être appelé deux fois — protéger par le statut en base.

---

## 10. Checklist de mise en production

**Compte SingPay**
- [ ] USSD Push explicitement activé sur le wallet (sinon `/ext` uniquement)
- [ ] `disbursement` obtenu et renseigné
- [ ] URL de callback déclarée dans le portefeuille
- [ ] Format `client_msisdn` confirmé par écrit

**Code**
- [ ] `singpayReference` unique en base + index
- [ ] Paiement créé en base **avant** l'appel réseau
- [ ] Garde anti-doublon avant d'initier
- [ ] Webhook : idempotence, cloisonnement tenant, re-vérification, montant, `parseInt`
- [ ] Tous les points de vérification passent par `resolveSingpayTransaction`
- [ ] `code` et `result_code` journalisés à chaque refus
- [ ] Aucune bascule silencieuse vers `/ext`
- [ ] Cohérence opérateur ↔ préfixe validée côté formulaire

**Environnement**
- [ ] Les 6 variables présentes en production (une seule manquante = panne asymétrique)
- [ ] Testé en conditions réelles : push, `/ext`, échec PIN, solde insuffisant, timeout

**Exploitation**
- [ ] Tâche planifiée de réconciliation des paiements `pending` de plus de N minutes
- [ ] Alerte sur les paiements `pending` anciens (symptôme d'un webhook muet)

---

## 11. Récapitulatif des pièges

| # | Piège | Conséquence | Parade |
|---|---|---|---|
| 1 | `/ext` ne retourne pas de `transactionId` | Aucun paiement hébergé confirmable | Résolution par référence (§5) |
| 2 | USSD Push non activé sur le compte | Refus permanent, code jamais en cause | Vérifier avant de développer (§0) |
| 3 | Message générique « Something went wrong » | Échecs indiagnosticables | Journaliser `code` + `result_code` (§6) |
| 4 | Bascule silencieuse vers `/ext` | La panne devient invisible | Toujours journaliser et informer |
| 5 | `transaction.amount` est une string | Validation de montant inopérante | `parseInt(…, 10)` |
| 6 | Confiance au body du webhook | Paiements forgeables | Re-vérification autoritative (§8) |
| 7 | Callback rejoué | Double décrément de stock | `callbackReceived` |
| 8 | Payment créé après l'appel API | Client débité sans trace | Écrire d'abord (§7) |
| 9 | `disbursement` manquant | Push refusé, `/ext` accepté | Vérifier les variables d'env |
| 10 | Format msisdn non documenté | Refus opaques | Faire confirmer, tester les deux |

---

## 12. Arbre de diagnostic

```
Le paiement échoue
│
├─ Exception « SingPay API Error (401/403) »
│  └─ Credentials ou droits → vérifier SINGPAY_CLIENT_ID / SECRET / wallet
│
├─ HTTP 200 avec status.success === false
│  ├─ Credentials VALIDES → refus applicatif
│  ├─ /ext fonctionne-t-il avec le même wallet ?
│  │  ├─ OUI → le problème est spécifique au push :
│  │  │        droits sur l'endpoint, disbursement, ou msisdn
│  │  └─ NON → problème de compte ou de wallet
│  └─ Lire code + result_code (les journaliser si absent)
│
└─ Le paiement reste « pending » indéfiniment
   ├─ callbackReceived = false ET transactionId = null
   │  └─ Paiement /ext non résolu → il manque la résolution par référence (§5)
   └─ URL de callback déclarée côté SingPay ?
```

Une requête qui résume la santé de l'intégration :

```sql
select status, count(*),
       count(*) filter (where callback_received) as avec_callback,
       count(*) filter (where singpay_transaction_id is null) as sans_tx_id
from payments
group by status;
```

`sans_tx_id` élevé sur des lignes confirmées signale des paiements `/ext` que
personne n'a résolus — le symptôme du piège n° 1.

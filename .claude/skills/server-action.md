# Skill : Server Action

Crée une Server Action dans `lib/actions/<domaine>.ts` en suivant le pattern Akôm.

## Pattern standard (mutation avec permission)

```ts
// lib/actions/<domaine>.ts
'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions/check'

// ============================================================
// Créer un <entité>
// ============================================================

export async function create<Entite>(data: {
  name: string
  // ...autres champs
}) {
  try {
    const { userId, restaurantId } = await requirePermission('<resource>', 'create')

    // Validation métier
    const existing = await prisma.<model>.findUnique({
      where: { restaurantId_name: { restaurantId, name: data.name } },
    })
    if (existing) return { error: 'Ce nom existe déjà' }

    const item = await prisma.<model>.create({
      data: { restaurantId, ...data },
    })

    revalidatePath('/dashboard/<module>')
    return { success: true, item }
  } catch (error) {
    console.error('Erreur création <entité>:', error)
    return { error: 'Erreur lors de la création' }
  }
}

// ============================================================
// Modifier un <entité>
// ============================================================

export async function update<Entite>(id: string, data: { name?: string }) {
  try {
    const { restaurantId } = await requirePermission('<resource>', 'update')

    const item = await prisma.<model>.update({
      where: { id, restaurantId }, // ← toujours inclure restaurantId
      data,
    })

    revalidatePath('/dashboard/<module>')
    return { success: true, item }
  } catch (error) {
    console.error('Erreur modification <entité>:', error)
    return { error: 'Erreur lors de la modification' }
  }
}

// ============================================================
// Supprimer un <entité>
// ============================================================

export async function delete<Entite>(id: string) {
  try {
    const { restaurantId } = await requirePermission('<resource>', 'delete')

    // Vérifier les dépendances avant suppression
    const deps = await prisma.<dependant>.count({
      where: { <entiteId>: id },
    })
    if (deps > 0) return { error: `Impossible : ${deps} élément(s) lié(s)` }

    await prisma.<model>.delete({ where: { id, restaurantId } })

    revalidatePath('/dashboard/<module>')
    return { success: true }
  } catch (error) {
    console.error('Erreur suppression <entité>:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}
```

## Helpers de permission disponibles

| Helper | Quand l'utiliser |
|--------|-----------------|
| `requirePermission(resource, action)` | Mutation standard — vérifie auth + membership + RBAC |
| `requirePermissionForRestaurant(restaurantId, resource, action)` | Quand le restaurantId est déjà connu (ex: webhook) |
| `requireMembership()` | Lecture simple sans contrôle RBAC granulaire |
| `requireMembershipForRestaurant(restaurantId)` | Vérifier qu'un user appartient à un restaurant précis |

Retournent `{ userId, restaurantId }` ou lèvent une `Error` (jamais de return silencieux).

## Resources RBAC disponibles

`restaurants` | `users` | `menu` | `categories` | `products` | `tables` | `orders` | `stocks` | `payments` | `stats` | `roles`

## Pattern transaction Prisma

```ts
await prisma.$transaction(async (tx) => {
  await tx.<modelA>.update({ where: { id, restaurantId }, data: { ... } })
  await tx.<modelB>.create({ data: { restaurantId, ... } })
})
```

## Appel depuis un composant client

```tsx
const result = await monAction(params)
if (result.error) {
  setError(result.error)
  setIsLoading(false)
} else {
  setOpen(false)
  router.refresh()
}
```

## Checklist

- [ ] `'use server'` en première ligne
- [ ] `requirePermission()` appelé une seule fois en haut de chaque action
- [ ] Toutes les queries Prisma filtrées par `restaurantId`
- [ ] `where: { id, restaurantId }` sur update/delete (jamais `id` seul)
- [ ] `revalidatePath()` après chaque mutation
- [ ] `try/catch` avec `console.error` + `return { error: '...' }`
- [ ] Pas de `any` — typer les paramètres et le retour
- [ ] Mutations atomiques dans `prisma.$transaction()` si plusieurs tables
- [ ] Vérifier les dépendances avant une suppression

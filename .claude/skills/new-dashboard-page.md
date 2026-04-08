# Skill : Nouvelle page dashboard

Crée une page dans `app/(dashboard)/dashboard/<module>/page.tsx` en suivant le pattern Akôm.

## Structure type (Server Component)

```tsx
// app/(dashboard)/dashboard/<module>/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { PageHeader } from '@/components/ui/page-header'
import { getLabels } from '@/lib/config/activity-labels'
// Importer les sous-composants client depuis le même dossier

export default async function <Module>Page() {
  // 1. Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Récupérer le restaurant (toujours inclure activityType)
  const restaurantUser = await prisma.restaurantUser.findFirst({
    where: { userId: user.id },
    include: {
      restaurant: { select: { activityType: true } },
    },
  })
  if (!restaurantUser) redirect('/onboarding')

  const restaurantId = restaurantUser.restaurantId
  const labels = getLabels(restaurantUser.restaurant.activityType)

  // 3. Données métier (toujours filtrer par restaurantId)
  const items = await prisma.<model>.findMany({
    where: { restaurantId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      {/* Header sticky avec breadcrumb */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex w-full items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Opérations</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{labels.XXXNameCapital}s</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Contenu */}
      <div className="layout-page">
        <PageHeader
          title={`${labels.XXXNameCapital}s`}
          description={`Gérez les ${labels.XXXNamePlural} de votre ${labels.structureName}`}
          action={<Button>Nouveau</Button>}
        />
        {/* Contenu métier */}
      </div>
    </>
  )
}
```

## Variante Client Component (temps réel)

Quand la page a besoin de données en temps réel (commandes, etc.), utiliser `'use client'` avec `useAuth()` + `useRestaurant()` :

```tsx
'use client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { getLabels } from '@/lib/config/activity-labels'

export default function <Module>Page() {
  const { user } = useAuth()
  const { currentRestaurant } = useRestaurant()
  const labels = getLabels(currentRestaurant?.activityType)
  // ...
}
```

## Fichier loading.tsx (obligatoire)

```tsx
// app/(dashboard)/dashboard/<module>/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="layout-page">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

## Checklist

- [ ] `restaurantId` filtré sur toutes les requêtes Prisma
- [ ] `activityType` inclus dans la query `restaurantUser`
- [ ] `getLabels()` appelé pour les labels dynamiques
- [ ] `redirect('/login')` si pas d'user, `redirect('/onboarding')` si pas de restaurant
- [ ] Header avec `SidebarTrigger` + `Breadcrumb` exact
- [ ] `layout-page` sur le conteneur racine
- [ ] `PageHeader` pour le titre (jamais `<h1>` nu)
- [ ] `loading.tsx` créé dans le même dossier
- [ ] Composants client dans `_components/` ou colocalisés dans le même dossier

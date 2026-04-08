# Skill : Nouveau composant UI Akôm

Crée un composant React respectant le design system Akôm (Tailwind v4 + shadcn/ui).

## Composant Dialog (mutation)

Pattern le plus courant — dialog avec form + server action.

```tsx
// app/(dashboard)/dashboard/<module>/create-<entite>-dialog.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { create<Entite> } from '@/lib/actions/<domaine>'

export function Create<Entite>Dialog({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      setIsLoading(false)
      setError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    const result = await create<Entite>({ name })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="type-dialog-title">Créer un <entité></DialogTitle>
          <DialogDescription className="type-body-muted">
            Description courte de l'action.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="layout-form">
          <div className="layout-field">
            <Label htmlFor="name" className="type-label">Nom</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: ..."
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <LoadingButton type="submit" isLoading={isLoading} loadingText="Enregistrement...">
              Créer
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

## Composant liste (AppCard + état vide)

```tsx
// <module>-list.tsx
'use client'

import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'

type Item = { id: string; name: string }

export function <Entite>List({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <AppCard>
        <CardContent className="layout-empty-state">
          <p className="type-body-muted text-center">Aucun élément pour le moment</p>
        </CardContent>
      </AppCard>
    )
  }

  return (
    <div className="layout-sections">
      {items.map((item) => (
        <AppCard key={item.id}>
          <CardContent className="layout-card-body">
            <p className="type-body">{item.name}</p>
          </CardContent>
        </AppCard>
      ))}
    </div>
  )
}
```

## Composant stat/KPI

```tsx
<AppCard variant="stat">
  <CardContent className="layout-card-body">
    <p className="type-label-meta">Revenus du jour</p>
    <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
    <p className="type-caption text-muted-foreground">+12% vs hier</p>
  </CardContent>
</AppCard>
```

## Règles de design system

**Typographie — classes obligatoires :**
| Contexte | Classe |
|----------|--------|
| Titre h1 page | `type-page-title` |
| Titre dialog/sheet | `type-dialog-title` |
| Titre card | `type-card-title` |
| Corps texte | `type-body` |
| Description atténuée | `type-body-muted` |
| Label formulaire | `type-label` |
| Label uppercase | `type-label-meta` |
| Timestamp | `type-caption` |

**Espacement — classes obligatoires :**
| Contexte | Classe |
|----------|--------|
| Page dashboard | `layout-page` |
| Sections majeures | `layout-sections` |
| Contenu card | `layout-card-body` |
| Formulaire | `layout-form` |
| Groupe champ | `layout-field` |
| Inline icon+texte | `layout-inline` |
| État vide | `layout-empty-state` |

**AppCard variants :** `default` | `flat` | `stat` | `pricing`

## Checklist

- [ ] `'use client'` si hooks React, callbacks, ou state
- [ ] Importer `AppCard` depuis `@/components/ui/app-card` (jamais `Card` direct)
- [ ] Utiliser classes `type-*` et `layout-*` — jamais `text-gray-*` ou `text-[Xpx]`
- [ ] État vide avec `layout-empty-state` sur `CardContent`
- [ ] Erreurs avec `text-destructive` (jamais `text-red-600`)
- [ ] `LoadingButton` pour les boutons de soumission
- [ ] Reset du state dans `handleOpenChange(false)`
- [ ] `router.refresh()` après succès (pas de state management externe)
- [ ] Pas de `font-regular` — utiliser `font-normal`

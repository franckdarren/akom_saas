// app/(dashboard)/dashboard/inventory/new-inventory-session-dialog.tsx
'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {createInventorySession} from '@/lib/actions/inventory'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'
import type {InventoryScope} from '@prisma/client'

interface NewInventorySessionDialogProps {
    warehouseEnabled: boolean
    categories: {id: string; name: string}[]
    warehouseCategories: string[]
    children: React.ReactNode
}

export function NewInventorySessionDialog({
    warehouseEnabled,
    categories,
    warehouseCategories,
    children,
}: NewInventorySessionDialogProps) {
    const router = useRouter()
    const {startLoading} = useNavigationLoading()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    // Le snapshot du stock peut porter sur des centaines de lignes : une fois la
    // session créée, l'ouverture de l'écran de comptage n'est pas instantanée.
    // On garde donc le dialog ouvert et le bouton en attente jusqu'à la
    // navigation, plutôt que de refermer sur une liste inchangée.
    const [isNavigating, setIsNavigating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [scope, setScope] = useState<InventoryScope>('operational')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [label, setLabel] = useState('')

    function handleOpenChange(newOpen: boolean) {
        // Ni Échap ni clic extérieur ne doivent fermer le dialog pendant la
        // création : la session est déjà en base, la fermer laisserait l'écran
        // sans aucun retour visuel.
        if (!newOpen && (isLoading || isNavigating)) return

        setOpen(newOpen)
        if (!newOpen) {
            setIsLoading(false)
            setError(null)
            setScope('operational')
            setCategoryFilter('all')
            setLabel('')
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const result = await createInventorySession({
            scope,
            label: label || undefined,
            categoryFilter: categoryFilter === 'all' ? undefined : categoryFilter,
        })

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            setIsNavigating(true)
            startLoading()
            router.push(`/dashboard/inventory/${result.sessionId}`)
        }
    }

    const scopeCategories = scope === 'operational'
        ? categories.map((c) => ({value: c.id, label: c.name}))
        : warehouseCategories.map((c) => ({value: c, label: c}))

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nouvel inventaire</DialogTitle>
                    <DialogDescription>
                        Le stock théorique actuel sera figé au lancement du comptage.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="layout-form">
                    <div className="layout-field">
                        <Label>Périmètre</Label>
                        <Select
                            value={scope}
                            onValueChange={(v) => {
                                setScope(v as InventoryScope)
                                setCategoryFilter('all')
                            }}
                            disabled={isLoading || isNavigating}
                        >
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="operational">Stock opérationnel</SelectItem>
                                {warehouseEnabled && (
                                    <SelectItem value="warehouse">Entrepôt</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {scopeCategories.length > 0 && (
                        <div className="layout-field">
                            <Label>Catégorie (optionnel)</Label>
                            <Select
                                value={categoryFilter}
                                onValueChange={setCategoryFilter}
                                disabled={isLoading || isNavigating}
                            >
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes catégories</SelectItem>
                                    {scopeCategories.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="layout-field">
                        <Label htmlFor="label">Nom (optionnel)</Label>
                        <Input
                            id="label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Ex: Inventaire mensuel juillet"
                            disabled={isLoading || isNavigating}
                        />
                    </div>

                    {error && (
                        <div className="bg-destructive-subtle text-destructive p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading || isNavigating}
                        >
                            Annuler
                        </Button>
                        <LoadingButton
                            type="submit"
                            isLoading={isLoading || isNavigating}
                            loadingText={isNavigating ? 'Ouverture du comptage…' : 'Création…'}
                        >
                            Lancer l&apos;inventaire
                        </LoadingButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

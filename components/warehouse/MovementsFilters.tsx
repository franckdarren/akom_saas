// components/warehouse/MovementsFilters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { X } from 'lucide-react'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MovementsFiltersProps {
    products: Array<{ id: string; name: string }>
}

/**
 * Filtres pour la page d'historique des mouvements.
 * 
 * Permet de filtrer par :
 * - Produit spécifique
 * - Type de mouvement
 * - Période (date de début et fin)
 * 
 * Les filtres sont reflétés dans l'URL pour partage et navigation.
 */
export function MovementsFilters({ products }: MovementsFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const movementTypes = [
        { value: 'entry', label: 'Entrée de stock' },
        { value: 'exit', label: 'Sortie de stock' },
        { value: 'transfer_to_ops', label: 'Transfert vers restaurant' },
        { value: 'adjustment', label: 'Ajustement' },
        { value: 'loss', label: 'Perte ou casse' },
    ]

    /**
     * Met à jour un filtre dans l'URL.
     */
    function updateFilter(key: string, value: string | null) {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString())

            if (value) {
                params.set(key, value)
            } else {
                params.delete(key)
            }

            router.push(`/dashboard/warehouse/movements?${params.toString()}`)
        })
    }

    /**
     * Réinitialise tous les filtres.
     */
    function clearAllFilters() {
        startTransition(() => {
            router.push('/dashboard/warehouse/movements')
        })
    }

    const activeFiltersCount = Array.from(searchParams.keys()).length

    return (
        <div className="space-y-4">
            {/* Ligne de filtres */}
            <div className="grid gap-4 md:grid-cols-4">
                {/* Filtre par produit */}
                <div className="space-y-2">
                    <Label htmlFor="product">Produit</Label>
                    <Select
                        value={searchParams.get('productId') || 'all'}
                        onValueChange={(value) => updateFilter('productId', value === 'all' ? null : value)}
                    >
                        <SelectTrigger id="product">
                            <SelectValue placeholder="Tous les produits" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les produits</SelectItem>
                            {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filtre par type */}
                <div className="space-y-2">
                    <Label htmlFor="type">Type de mouvement</Label>
                    <Select
                        value={searchParams.get('type') || 'all'}
                        onValueChange={(value) => updateFilter('type', value === 'all' ? null : value)}
                    >
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Tous les types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les types</SelectItem>
                            {movementTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filtre par date de début */}
                <div className="space-y-2">
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                        id="startDate"
                        type="date"
                        value={searchParams.get('startDate') || ''}
                        onChange={(e) => updateFilter('startDate', e.target.value || null)}
                    />
                </div>

                {/* Filtre par date de fin */}
                <div className="space-y-2">
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input
                        id="endDate"
                        type="date"
                        value={searchParams.get('endDate') || ''}
                        onChange={(e) => updateFilter('endDate', e.target.value || null)}
                    />
                </div>
            </div>

            {/* Badges des filtres actifs */}
            {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Filtres actifs:</span>

                    {searchParams.get('productId') && (
                        <Badge variant="secondary" className="gap-1">
                            Produit: {products.find(p => p.id === searchParams.get('productId'))?.name}
                            <button
                                onClick={() => updateFilter('productId', null)}
                                className="ml-1 hover:bg-background/20 rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {searchParams.get('type') && (
                        <Badge variant="secondary" className="gap-1">
                            Type: {movementTypes.find(t => t.value === searchParams.get('type'))?.label}
                            <button
                                onClick={() => updateFilter('type', null)}
                                className="ml-1 hover:bg-background/20 rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {searchParams.get('startDate') && (
                        <Badge variant="secondary" className="gap-1">
                            Depuis: {new Date(searchParams.get('startDate')!).toLocaleDateString('fr-FR')}
                            <button
                                onClick={() => updateFilter('startDate', null)}
                                className="ml-1 hover:bg-background/20 rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {searchParams.get('endDate') && (
                        <Badge variant="secondary" className="gap-1">
                            Jusqu'au: {new Date(searchParams.get('endDate')!).toLocaleDateString('fr-FR')}
                            <button
                                onClick={() => updateFilter('endDate', null)}
                                className="ml-1 hover:bg-background/20 rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-6 text-xs"
                    >
                        Tout effacer
                    </Button>
                </div>
            )}

            {/* Indicateur de chargement */}
            {isPending && (
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary animate-pulse" />
                </div>
            )}
        </div>
    )
}
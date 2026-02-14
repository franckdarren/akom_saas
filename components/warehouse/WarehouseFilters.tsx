// components/warehouse/WarehouseFilters.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { storageUnits } from '@/lib/validations/warehouse'

/**
 * Barre de filtres pour la liste des produits d'entrepôt.
 * 
 * Permet de filtrer par :
 * - Recherche textuelle (nom ou SKU)
 * - Catégorie
 * - Type d'unité de stockage
 * - Stock bas uniquement
 * 
 * Les filtres sont reflétés dans l'URL pour permettre le partage et le back/forward.
 * Design inspiré de Vercel Analytics et Linear.
 */
export function WarehouseFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // État local pour la recherche (debounced)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

    // Catégories disponibles (en production, à récupérer depuis la BDD)
    const categories = ['Boissons', 'Alcools', 'Épicerie', 'Condiments', 'Autre']

    /**
     * Met à jour les paramètres de recherche dans l'URL.
     * Utilise une transition pour éviter de bloquer l'UI.
     */
    function updateFilter(key: string, value: string | null) {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString())

            if (value) {
                params.set(key, value)
            } else {
                params.delete(key)
            }

            router.push(`/dashboard/warehouse?${params.toString()}`)
        })
    }

    /**
     * Réinitialise tous les filtres.
     */
    function clearAllFilters() {
        startTransition(() => {
            router.push('/dashboard/warehouse')
        })
        setSearchQuery('')
    }

    // Compte le nombre de filtres actifs
    const activeFiltersCount = Array.from(searchParams.keys()).filter(
        key => key !== 'search' || searchParams.get('search')
    ).length

    return (
        <div className="space-y-4">
            {/* Barre de recherche et filtres principaux */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Champ de recherche */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom ou SKU..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            // Debounce la recherche de 300ms
                            const timer = setTimeout(() => {
                                updateFilter('search', e.target.value || null)
                            }, 300)
                            return () => clearTimeout(timer)
                        }}
                        className="pl-9"
                    />
                </div>

                {/* Filtre par catégorie */}
                <Select
                    value={searchParams.get('category') || 'all'}
                    onValueChange={(value) => updateFilter('category', value === 'all' ? null : value)}
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Filtre par unité de stockage */}
                <Select
                    value={searchParams.get('storageUnit') || 'all'}
                    onValueChange={(value) => updateFilter('storageUnit', value === 'all' ? null : value)}
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Unité" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes unités</SelectItem>
                        {storageUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                                {capitalizeFirst(unit)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Toggle stock bas */}
                <Button
                    variant={searchParams.get('lowStock') === 'true' ? 'default' : 'outline'}
                    onClick={() =>
                        updateFilter('lowStock', searchParams.get('lowStock') === 'true' ? null : 'true')
                    }
                    className="gap-2"
                >
                    <Filter className="h-4 w-4" />
                    Stock bas
                </Button>
            </div>

            {/* Badges des filtres actifs */}
            {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Filtres actifs:</span>

                    {searchParams.get('search') && (
                        <Badge variant="secondary" className="gap-1">
                            Recherche: "{searchParams.get('search')}"
                            <button
                                onClick={() => {
                                    setSearchQuery('')
                                    updateFilter('search', null)
                                }}
                                className="ml-1 hover:bg-background/20 rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {searchParams.get('category') && (
                        <Badge variant="secondary" className="gap-1">
                            Catégorie: {searchParams.get('category')}
                            <button
                                onClick={() => updateFilter('category', null)}
                                className="ml-1 hover:bg-background/20 rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}

                    {searchParams.get('storageUnit') && (
                        <Badge variant="secondary" className="gap-1">
                            Unité: {capitalizeFirst(searchParams.get('storageUnit')!)}
                            <button
                                onClick={() => updateFilter('storageUnit', null)}
                                className="ml-1 hover:bg-background/20 rounded-full"></button>
                        </Badge>
            )}

            {searchParams.get('lowStock') === 'true' && (
                <Badge variant="secondary" className="gap-1">
                    Stock bas uniquement
                    <button
                        onClick={() => updateFilter('lowStock', null)}
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
    )
}

{/* Indicateur de chargement pendant les transitions */ }
{
    isPending && (
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-primary animate-pulse" />
        </div>
    )
}
    </div >
  )
}

/**
 * Capitalise la première lettre d'une chaîne.
 */
function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
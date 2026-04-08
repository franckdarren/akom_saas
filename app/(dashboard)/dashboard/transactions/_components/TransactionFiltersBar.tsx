// app/(dashboard)/dashboard/transactions/_components/TransactionFiltersBar.tsx
'use client'

import {useEffect, useRef} from 'react'
import {Search, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {cn} from '@/lib/utils'
import type {TransactionSource, TransactionDirection, TransactionStatus, TransactionMethod} from '@/types/transaction'

export type DatePreset = 'today' | 'week' | 'month' | 'last_month' | 'all'

export interface ActiveFilters {
    preset: DatePreset
    source: TransactionSource | 'all'
    direction: TransactionDirection | 'all'
    status: TransactionStatus | 'all'
    method: TransactionMethod | 'all'
    search: string
}

interface TransactionFiltersBarProps {
    filters: ActiveFilters
    onChange: (filters: ActiveFilters) => void
    isPending: boolean
}

const PRESET_LABELS: Record<DatePreset, string> = {
    today: "Aujourd'hui",
    week: 'Cette semaine',
    month: 'Ce mois',
    last_month: 'Mois dernier',
    all: 'Tout',
}

const PRESETS: DatePreset[] = ['today', 'week', 'month', 'last_month', 'all']

export function TransactionFiltersBar({filters, onChange, isPending}: TransactionFiltersBarProps) {
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Debounce la recherche texte (300ms)
    function handleSearchChange(value: string) {
        if (searchRef.current) clearTimeout(searchRef.current)
        searchRef.current = setTimeout(() => {
            onChange({...filters, search: value})
        }, 300)
    }

    useEffect(() => {
        return () => {
            if (searchRef.current) clearTimeout(searchRef.current)
        }
    }, [])

    const hasActiveFilters =
        filters.preset !== 'month' ||
        filters.source !== 'all' ||
        filters.direction !== 'all' ||
        filters.status !== 'all' ||
        filters.method !== 'all' ||
        filters.search !== ''

    function resetFilters() {
        onChange({
            preset: 'month',
            source: 'all',
            direction: 'all',
            status: 'all',
            method: 'all',
            search: '',
        })
    }

    return (
        <div className="space-y-3">
            {/* Ligne 1 : Présets de date */}
            <div className="flex flex-wrap gap-2">
                {PRESETS.map(preset => (
                    <Button
                        key={preset}
                        variant={filters.preset === preset ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onChange({...filters, preset})}
                        disabled={isPending}
                        className="h-8"
                    >
                        {PRESET_LABELS[preset]}
                    </Button>
                ))}
            </div>

            {/* Ligne 2 : Filtres + recherche */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Source */}
                <Select
                    value={filters.source}
                    onValueChange={val =>
                        onChange({...filters, source: val as TransactionSource | 'all'})
                    }
                    disabled={isPending}
                >
                    <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue placeholder="Source"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les sources</SelectItem>
                        <SelectItem value="order_payment">Commandes</SelectItem>
                        <SelectItem value="manual_revenue">Recettes manuelles</SelectItem>
                        <SelectItem value="expense">Dépenses</SelectItem>
                        <SelectItem value="subscription_payment">Abonnements</SelectItem>
                    </SelectContent>
                </Select>

                {/* Direction */}
                <Select
                    value={filters.direction}
                    onValueChange={val =>
                        onChange({...filters, direction: val as TransactionDirection | 'all'})
                    }
                    disabled={isPending}
                >
                    <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Direction"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tout</SelectItem>
                        <SelectItem value="in">Entrées uniquement</SelectItem>
                        <SelectItem value="out">Sorties uniquement</SelectItem>
                    </SelectContent>
                </Select>

                {/* Méthode */}
                <Select
                    value={filters.method}
                    onValueChange={val =>
                        onChange({...filters, method: val as TransactionMethod | 'all'})
                    }
                    disabled={isPending}
                >
                    <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue placeholder="Méthode"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les méthodes</SelectItem>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="airtel_money">Airtel Money</SelectItem>
                        <SelectItem value="moov_money">Moov Money</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="card">Carte</SelectItem>
                        <SelectItem value="manual">Manuel</SelectItem>
                    </SelectContent>
                </Select>

                {/* Statut */}
                <Select
                    value={filters.status}
                    onValueChange={val =>
                        onChange({...filters, status: val as TransactionStatus | 'all'})
                    }
                    disabled={isPending}
                >
                    <SelectTrigger className="h-8 w-[150px]">
                        <SelectValue placeholder="Statut"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="confirmed">Confirmé</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="failed">Échoué</SelectItem>
                        <SelectItem value="refunded">Remboursé</SelectItem>
                    </SelectContent>
                </Select>

                {/* Recherche */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground"/>
                    <Input
                        placeholder="Rechercher..."
                        defaultValue={filters.search}
                        onChange={e => handleSearchChange(e.target.value)}
                        disabled={isPending}
                        className="h-8 pl-8"
                    />
                </div>

                {/* Réinitialiser */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        disabled={isPending}
                        className={cn('h-8 gap-1 text-muted-foreground', isPending && 'opacity-50')}
                    >
                        <X className="h-3.5 w-3.5"/>
                        Réinitialiser
                    </Button>
                )}
            </div>
        </div>
    )
}

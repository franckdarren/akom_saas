// components/kitchen/OrderFilters.tsx
'use client'

import { Button } from '@/components/ui/button'
import { useActivityLabels } from '@/lib/hooks/use-activity-labels'
import { useRestaurant } from '@/lib/hooks/use-restaurant'
import { getOrderFlow } from '@/lib/config/order-status'
import type { OrderStatusFilter } from '@/lib/hooks/use-orders-realtime'

interface OrderFiltersProps {
    activeFilter: OrderStatusFilter
    onFilterChange: (filter: OrderStatusFilter) => void
    counts: {
        [key in OrderStatusFilter]?: number
    }
}

export function OrderFilters({ activeFilter, onFilterChange, counts }: OrderFiltersProps) {
    const labels = useActivityLabels()
    const { currentRestaurant } = useRestaurant()
    const s = labels.orderStatuses
    const { steps } = getOrderFlow(currentRestaurant?.activityType)

    // Filtres dynamiques : on ne montre que les étapes du flow de l'activité,
    // plus "Toutes" en tête et "Annulées" en fin.
    const filters: { value: OrderStatusFilter; label: string }[] = [
        { value: 'all', label: 'Toutes' },
        ...steps.map((step) => ({
            value: step as OrderStatusFilter,
            label: s[step].filterLabel,
        })),
        { value: 'cancelled', label: s.cancelled.filterLabel },
    ]

    return (
        <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
                const count = counts[filter.value] ?? 0
                const isActive = activeFilter === filter.value

                return (
                    <Button
                        key={filter.value}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onFilterChange(filter.value)}
                        className="gap-2"
                    >
                        {filter.label}
                        {count > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${isActive
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-muted text-foreground'
                                }`}>
                                {count}
                            </span>
                        )}
                    </Button>
                )
            })}
        </div>
    )
}
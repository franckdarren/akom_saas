// components/kitchen/OrderFilters.tsx
'use client'

import { Button } from '@/components/ui/button'
import { useActivityLabels } from '@/lib/hooks/use-activity-labels'
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
    const s = labels.orderStatuses

    const filters: { value: OrderStatusFilter; label: string }[] = [
        { value: 'all', label: 'Toutes' },
        { value: 'pending', label: s.pending.filterLabel },
        { value: 'preparing', label: s.preparing.filterLabel },
        { value: 'ready', label: s.ready.filterLabel },
        { value: 'delivered', label: s.delivered.filterLabel },
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
                                ? 'bg-white/20 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
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
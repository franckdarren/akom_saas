// components/dashboard/stats/PeriodFilter.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Calendar, ChevronDown } from 'lucide-react'
import { TIME_PERIODS, type TimePeriod } from '@/types/stats'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PeriodFilterProps {
    value: TimePeriod
    onChange: (period: TimePeriod) => void
}

const periodLabels = {
    [TIME_PERIODS.TODAY]: "Aujourd'hui",
    [TIME_PERIODS.WEEK]: '7 derniers jours',
    [TIME_PERIODS.MONTH]: '30 derniers jours',
    [TIME_PERIODS.CUSTOM]: 'Période personnalisée',
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
    return (
        <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        {periodLabels[value]}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {Object.entries(periodLabels).map(([key, label]) => {
                        // Skip custom pour le MVP (on l'ajoutera post-MVP)
                        if (key === TIME_PERIODS.CUSTOM) return null

                        return (
                            <DropdownMenuItem
                                key={key}
                                onClick={() => onChange(key as TimePeriod)}
                                className={cn(
                                    value === key && 'bg-zinc-100 dark:bg-zinc-800'
                                )}
                            >
                                {label}
                            </DropdownMenuItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
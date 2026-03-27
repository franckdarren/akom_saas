'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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

const periodLabels: Record<string, string> = {
    [TIME_PERIODS.TODAY]: "Aujourd'hui",
    [TIME_PERIODS.WEEK]: '7 derniers jours',
    [TIME_PERIODS.MONTH]: '30 derniers jours',
}

interface PeriodFilterNavProps {
    value: TimePeriod
}

export function PeriodFilterNav({ value }: PeriodFilterNavProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function handleChange(period: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', period)
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        {periodLabels[value] ?? periodLabels[TIME_PERIODS.WEEK]}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {Object.entries(periodLabels).map(([key, label]) => (
                        <DropdownMenuItem
                            key={key}
                            onClick={() => handleChange(key)}
                            className={cn(value === key && 'bg-zinc-100 dark:bg-zinc-800')}
                        >
                            {label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

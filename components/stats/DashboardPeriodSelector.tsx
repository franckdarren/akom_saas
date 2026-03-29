'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/stats/date-range-picker'
import { TIME_PERIODS, type TimePeriod } from '@/types/stats'
import type { DateRange } from 'react-day-picker'

export function DashboardPeriodSelector({ value }: { value: TimePeriod }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (fromParam && toParam) {
            const from = new Date(fromParam)
            const to = new Date(toParam)
            if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                return { from, to }
            }
        }
        return undefined
    })

    function pushParams(period: string, from?: string, to?: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', period)
        if (from && to) {
            params.set('from', from)
            params.set('to', to)
        } else {
            params.delete('from')
            params.delete('to')
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    function handlePeriodChange(period: TimePeriod) {
        if (period !== TIME_PERIODS.CUSTOM) {
            setDateRange(undefined)
            pushParams(period)
        } else {
            pushParams(period)
        }
    }

    function handleDateRangeChange(range: DateRange | undefined) {
        setDateRange(range)
        if (range?.from && range?.to) {
            pushParams(
                TIME_PERIODS.CUSTOM,
                range.from.toISOString().slice(0, 10),
                range.to.toISOString().slice(0, 10),
            )
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select value={value} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[150px] sm:w-[180px]">
                    <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={TIME_PERIODS.TODAY}>Aujourd&apos;hui</SelectItem>
                    <SelectItem value={TIME_PERIODS.WEEK}>7 derniers jours</SelectItem>
                    <SelectItem value={TIME_PERIODS.MONTH}>30 derniers jours</SelectItem>
                    <SelectItem value={TIME_PERIODS.CUSTOM}>Période personnalisée</SelectItem>
                </SelectContent>
            </Select>

            {value === TIME_PERIODS.CUSTOM && (
                <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
            )}
        </div>
    )
}

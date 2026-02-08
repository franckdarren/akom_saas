'use client'

import { useState } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/stats/date-range-picker"
import type { TimePeriod, CustomPeriod } from "@/types/stats"
import { DateRange } from "react-day-picker"

interface PeriodSelectorProps {
    value: TimePeriod
    onValueChange: (period: TimePeriod, customPeriod?: CustomPeriod) => void
}

export function PeriodSelector({ value, onValueChange }: PeriodSelectorProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    // Quand l'utilisateur change la période prédéfinie
    function handlePeriodChange(period: TimePeriod) {
        if (period !== 'custom') {
            // Pour les périodes prédéfinies, on reset le date range
            setDateRange(undefined)
            onValueChange(period)
        } else {
            // Pour custom, on passe à la période custom
            onValueChange(period)
        }
    }

    // Quand l'utilisateur sélectionne une plage de dates personnalisée
    function handleDateRangeChange(range: DateRange | undefined) {
        setDateRange(range)

        // Si les deux dates sont sélectionnées, on met à jour les stats
        if (range?.from && range?.to) {
            onValueChange('custom', {
                startDate: range.from,
                endDate: range.to,
            })
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Select value={value} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">7 derniers jours</SelectItem>
                    <SelectItem value="month">30 derniers jours</SelectItem>
                    <SelectItem value="custom">Période personnalisée</SelectItem>
                </SelectContent>
            </Select>

            {/* Afficher le date picker uniquement si période custom est sélectionnée */}
            {value === 'custom' && (
                <DateRangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                />
            )}
        </div>
    )
}
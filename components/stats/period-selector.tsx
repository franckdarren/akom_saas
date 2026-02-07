'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TimePeriod } from '@/types/stats'

interface PeriodSelectorProps {
    value: TimePeriod
    onValueChange: (value: TimePeriod) => void
}

export function PeriodSelector({ value, onValueChange }: PeriodSelectorProps) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
            </SelectContent>
        </Select>
    )
}
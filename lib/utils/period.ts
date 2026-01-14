// lib/utils/period.ts
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import type { TimePeriod, PeriodRange, CustomPeriod } from '@/types/stats'

/*************************************************************
 * Calcule la plage de dates selon la période sélectionnée
 * Inclut aussi la période précédente pour comparaison
 ************************************************************/
export function getPeriodRange(
    period: TimePeriod,
    customPeriod?: CustomPeriod
): PeriodRange {
    const now = new Date()

    switch (period) {
        case 'today': {
            const startDate = startOfDay(now)
            const endDate = endOfDay(now)
            const previousStartDate = startOfDay(subDays(now, 1))
            const previousEndDate = endOfDay(subDays(now, 1))

            return { startDate, endDate, previousStartDate, previousEndDate }
        }

        case 'week': {
            const startDate = startOfWeek(now, { weekStartsOn: 1 }) // Lundi
            const endDate = endOfWeek(now, { weekStartsOn: 1 })
            const previousStartDate = startOfWeek(subDays(now, 7), { weekStartsOn: 1 })
            const previousEndDate = endOfWeek(subDays(now, 7), { weekStartsOn: 1 })

            return { startDate, endDate, previousStartDate, previousEndDate }
        }

        case 'month': {
            const startDate = startOfMonth(now)
            const endDate = endOfMonth(now)
            const previousStartDate = startOfMonth(subDays(startDate, 1))
            const previousEndDate = endOfMonth(subDays(startDate, 1))

            return { startDate, endDate, previousStartDate, previousEndDate }
        }

        case 'custom': {
            if (!customPeriod) {
                throw new Error('Custom period requires startDate and endDate')
            }

            const startDate = startOfDay(customPeriod.startDate)
            const endDate = endOfDay(customPeriod.endDate)

            // Période précédente = même durée avant
            const durationDays = Math.ceil(
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            )
            const previousEndDate = startOfDay(subDays(startDate, 1))
            const previousStartDate = subDays(previousEndDate, durationDays - 1)

            return { startDate, endDate, previousStartDate, previousEndDate }
        }

        default:
            throw new Error(`Unknown period: ${period}`)
    }
}

/*************************************************************
 * Formatte une période pour affichage
 ************************************************************/
export function formatPeriodLabel(period: TimePeriod, customPeriod?: CustomPeriod): string {
    switch (period) {
        case 'today':
            return "Aujourd'hui"
        case 'week':
            return '7 derniers jours'
        case 'month':
            return '30 derniers jours'
        case 'custom':
            if (!customPeriod) return 'Période personnalisée'
            return `${customPeriod.startDate.toLocaleDateString('fr-FR')} - ${customPeriod.endDate.toLocaleDateString('fr-FR')}`
        default:
            return 'Période inconnue'
    }
}
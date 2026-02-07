// lib/utils/period.ts
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import type { TimePeriod, PeriodRange, CustomPeriod } from '@/types/stats'

/*************************************************************
 * Calcule la plage de dates selon la période sélectionnée
 * Inclut aussi la période précédente pour comparaison
 ************************************************************/
/**
 * Fournit des plages start/end en UTC (0:00:00.000 -> 23:59:59.999 UTC)
 * Durée "week" = 7 jours inclusifs, "month" = 30 jours inclusifs.
 */
export function getPeriodRange(period: TimePeriod, customPeriod?: CustomPeriod): PeriodRange {
  const now = new Date()

  // utility helpers (UTC)
  const startOfUtcDay = (d: Date) => {
    const r = new Date(d)
    r.setUTCFullYear(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    r.setUTCHours(0, 0, 0, 0)
    return r
  }
  const endOfUtcDay = (d: Date) => {
    const r = new Date(d)
    r.setUTCFullYear(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    r.setUTCHours(23, 59, 59, 999)
    return r
  }
  const subUtcDays = (d: Date, days: number) => {
    const r = new Date(d)
    r.setUTCDate(r.getUTCDate() - days)
    return r
  }

  switch (period) {
    case 'today': {
      const startDate = startOfUtcDay(now)
      const endDate = endOfUtcDay(now)
      const previousStartDate = startOfUtcDay(subUtcDays(now, 1))
      const previousEndDate = endOfUtcDay(subUtcDays(now, 1))
      return { startDate, endDate, previousStartDate, previousEndDate }
    }

    case 'week': {
      const duration = 7
      const startDate = startOfUtcDay(subUtcDays(now, duration - 1))
      const endDate = endOfUtcDay(now)
      const previousEndDate = endOfUtcDay(subUtcDays(startDate, 1))
      const previousStartDate = startOfUtcDay(subUtcDays(startDate, duration))
      return { startDate, endDate, previousStartDate, previousEndDate }
    }

    case 'month': {
      const duration = 30
      const startDate = startOfUtcDay(subUtcDays(now, duration - 1))
      const endDate = endOfUtcDay(now)
      const previousEndDate = endOfUtcDay(subUtcDays(startDate, 1))
      const previousStartDate = startOfUtcDay(subUtcDays(startDate, duration))
      return { startDate, endDate, previousStartDate, previousEndDate }
    }

    case 'custom': {
      if (!customPeriod) throw new Error('Custom period requires startDate and endDate')
      const startDate = startOfUtcDay(new Date(customPeriod.startDate))
      const endDate = endOfUtcDay(new Date(customPeriod.endDate))

      // durée incluant les 2 bornes
      const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const previousEndDate = endOfUtcDay(subUtcDays(startDate, 1))
      const previousStartDate = startOfUtcDay(subUtcDays(previousEndDate, durationDays - 1))
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
// lib/utils/period.ts
import { startOfDay, endOfDay, subDays } from 'date-fns'
import type { TimePeriod, PeriodRange, CustomPeriod } from '@/types/stats'

/*************************************************************
 * Calcule la plage de dates selon la période sélectionnée
 * Inclut aussi la période précédente pour comparaison
 ************************************************************/

/**
 * Convertit une date locale en début de journée UTC
 * Pour une date sélectionnée dans le date picker (ex: 15 jan 2026 00:00 GMT+1)
 * On veut 15 jan 2026 00:00 UTC (pas 14 jan 23:00 UTC)
 */
function toUtcStartOfDay(date: Date): Date {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  
  // Créer une nouvelle date en UTC avec les mêmes composants de date locale
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
}

/**
 * Convertit une date locale en fin de journée UTC
 */
function toUtcEndOfDay(date: Date): Date {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  
  // 23:59:59.999 UTC
  return new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
}

/**
 * Soustrait des jours à une date (en UTC)
 */
function subUtcDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() - days)
  return result
}

export function getPeriodRange(period: TimePeriod, customPeriod?: CustomPeriod): PeriodRange {
  const now = new Date()

  switch (period) {
    case 'today': {
      const startDate = toUtcStartOfDay(now)
      const endDate = toUtcEndOfDay(now)
      const previousStartDate = subUtcDays(startDate, 1)
      const previousEndDate = subUtcDays(endDate, 1)
      return { startDate, endDate, previousStartDate, previousEndDate }
    }

    case 'week': {
      const duration = 7
      const endDate = toUtcEndOfDay(now)
      const startDate = subUtcDays(toUtcStartOfDay(now), duration - 1)
      const previousEndDate = subUtcDays(startDate, 1)
      const previousStartDate = subUtcDays(previousEndDate, duration - 1)
      return { startDate, endDate, previousStartDate, previousEndDate }
    }

    case 'month': {
      const duration = 30
      const endDate = toUtcEndOfDay(now)
      const startDate = subUtcDays(toUtcStartOfDay(now), duration - 1)
      const previousEndDate = subUtcDays(startDate, 1)
      const previousStartDate = subUtcDays(previousEndDate, duration - 1)
      return { startDate, endDate, previousStartDate, previousEndDate }
    }

    case 'custom': {
      if (!customPeriod?.startDate || !customPeriod?.endDate) {
        // Fallback sur 'week' si customPeriod est absent ou mal formé
        // Cela évite un crash quand period='custom' mais les dates ne sont pas encore saisies
        const duration = 7
        const endDate = toUtcEndOfDay(now)
        const startDate = subUtcDays(toUtcStartOfDay(now), duration - 1)
        const previousEndDate = subUtcDays(startDate, 1)
        const previousStartDate = subUtcDays(previousEndDate, duration - 1)
        return { startDate, endDate, previousStartDate, previousEndDate }
      }

      // ⚠️ Les Server Actions sérialisent les Date en string ISO.
      // On force la conversion en Date ici pour être robuste.
      const startDate = toUtcStartOfDay(new Date(customPeriod.startDate))
      const endDate = toUtcEndOfDay(new Date(customPeriod.endDate))

      const durationMs = endDate.getTime() - startDate.getTime()
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24))
      const previousEndDate = subUtcDays(startDate, 1)
      const previousStartDate = subUtcDays(previousEndDate, durationDays - 1)

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
      
      // Formater les dates en français
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }
      
      const startStr = customPeriod.startDate.toLocaleDateString('fr-FR', options)
      const endStr = customPeriod.endDate.toLocaleDateString('fr-FR', options)
      
      return `${startStr} - ${endStr}`
    default:
      return 'Période inconnue'
  }
}
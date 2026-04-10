// lib/actions/stats/cash-analytics.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import prisma from '@/lib/prisma'
import { getPeriodRange } from '@/lib/utils/period'
import type { TimePeriod, CustomPeriod, CashAnalytics, CashSessionStat, CashOperatorStat } from '@/types/stats'

// ============================================================
// Auth interne — même pattern que les autres actions stats
// ============================================================

async function getCurrentRestaurantId(): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        select: { restaurantId: true },
    })
    if (!restaurantUser) throw new Error('Aucun restaurant trouvé')

    return restaurantUser.restaurantId
}

// ============================================================
// ANALYTICS CAISSE
// ============================================================

export async function getCashAnalytics(
    period: TimePeriod,
    customPeriod?: CustomPeriod,
): Promise<CashAnalytics> {
    const restaurantId = await getCurrentRestaurantId()
    const { startDate, endDate, previousStartDate, previousEndDate } = getPeriodRange(period, customPeriod)

    // sessionDate est @db.Date → normalisation ISO UTC
    const startISO = startDate.toISOString().slice(0, 10)
    const endISO = endDate.toISOString().slice(0, 10)
    const dateStart = new Date(startISO)
    const dateEnd = new Date(endISO + 'T23:59:59.999Z')

    const prevStartISO = previousStartDate.toISOString().slice(0, 10)
    const prevEndISO = previousEndDate.toISOString().slice(0, 10)
    const prevDateStart = new Date(prevStartISO)
    const prevDateEnd = new Date(prevEndISO + 'T23:59:59.999Z')

    // Récupérer toutes les sessions de la période + count période précédente
    const [sessions, previousSessionsCount] = await Promise.all([
        prisma.cashSession.findMany({
            where: {
                restaurantId,
                sessionDate: { gte: dateStart, lte: dateEnd },
            },
            select: {
                id: true,
                sessionDate: true,
                openingBalance: true,
                closingBalance: true,
                balanceDifference: true,
                status: true,
                openedBy: true,
                closedBy: true,
            },
            orderBy: { sessionDate: 'asc' },
        }),
        prisma.cashSession.count({
            where: {
                restaurantId,
                sessionDate: { gte: prevDateStart, lte: prevDateEnd },
            },
        }),
    ])

    // ——— KPIs soldes ———
    const closedSessions = sessions.filter((s) => s.status === 'closed')

    const avgOpeningBalance =
        sessions.length > 0
            ? Math.round(sessions.reduce((sum, s) => sum + s.openingBalance, 0) / sessions.length)
            : 0

    const avgClosingBalance =
        closedSessions.length > 0
            ? Math.round(
                  closedSessions.reduce((sum, s) => sum + (s.closingBalance ?? 0), 0) /
                      closedSessions.length,
              )
            : null

    // Écarts : sessions clôturées avec |balanceDifference| > 500 FCFA
    const sessionsWithGap = closedSessions.filter(
        (s) => s.balanceDifference !== null && Math.abs(s.balanceDifference) > 500,
    )

    const gapCount = sessionsWithGap.length

    const avgGapAmount =
        sessionsWithGap.length > 0
            ? Math.round(
                  sessionsWithGap.reduce(
                      (sum, s) => sum + Math.abs(s.balanceDifference ?? 0),
                      0,
                  ) / sessionsWithGap.length,
              )
            : null

    // ——— Activité des opérateurs ———
    // Collecter les userId uniques (openedBy + closedBy)
    const userIds = new Set<string>()
    for (const s of sessions) {
        userIds.add(s.openedBy)
        if (s.closedBy) userIds.add(s.closedBy)
    }

    // Résoudre les emails via supabaseAdmin en un seul appel batch
    let emailMap = new Map<string, string>()
    if (userIds.size > 0) {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        emailMap = new Map(
            (usersData?.users ?? []).map((u) => [u.id, u.email || 'Email inconnu']),
        )
    }

    // Agréger sessions par opérateur
    const openedByMap = new Map<string, number>()
    const closedByMap = new Map<string, number>()

    for (const s of sessions) {
        openedByMap.set(s.openedBy, (openedByMap.get(s.openedBy) ?? 0) + 1)
        if (s.closedBy) {
            closedByMap.set(s.closedBy, (closedByMap.get(s.closedBy) ?? 0) + 1)
        }
    }

    const operators: CashOperatorStat[] = Array.from(userIds)
        .map((userId) => ({
            userId,
            email: emailMap.get(userId) ?? 'Utilisateur inconnu',
            sessionsOpened: openedByMap.get(userId) ?? 0,
            sessionsClosed: closedByMap.get(userId) ?? 0,
        }))
        .sort((a, b) => b.sessionsOpened - a.sessionsOpened)

    // ——— Données pour les graphiques ———
    const sessionStats: CashSessionStat[] = sessions.map((s) => ({
        id: s.id,
        sessionDate: s.sessionDate.toISOString().slice(0, 10),
        openingBalance: s.openingBalance,
        closingBalance: s.closingBalance,
        balanceDifference: s.balanceDifference,
        status: s.status,
    }))

    return {
        sessions: sessionStats,
        avgOpeningBalance,
        avgClosingBalance,
        avgGapAmount,
        gapCount,
        operators,
        previousSessionsCount,
    }
}

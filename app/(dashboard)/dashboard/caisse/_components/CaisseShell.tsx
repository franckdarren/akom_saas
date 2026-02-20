// app/dashboard/caisse/_components/CaisseShell.tsx
'use client'

import {useState} from 'react'
import {CalendarDays, ArrowLeft} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {OpenSessionCard} from './OpenSessionCard'
import {SessionDashboard} from './SessionDashboard'
import {SessionSummary} from './SessionSummary'
import {HistoryCalendar} from './history/HistoryCalendar'
import type {
    SessionWithRelations,
    SessionSummary as SessionSummaryType,
    ProductWithStock,
} from '../_types'

interface CaisseShellProps {
    todaySession: SessionWithRelations | null
    recentSessions: SessionSummaryType[]
    products: ProductWithStock[]
    restaurantId: string
}

export function CaisseShell({
                                todaySession,
                                recentSessions,
                                products,
                                restaurantId,
                            }: CaisseShellProps) {
    // activeSession peut être la session du jour OU une session historique
    // sélectionnée depuis le calendrier. Cela permet d'utiliser les mêmes
    // composants pour les deux cas d'usage.
    const [activeSession, setActiveSession] = useState<SessionWithRelations | null>(todaySession)
    const [showHistory, setShowHistory] = useState(false)

    const handleSelectSession = (session: SessionWithRelations) => {
        setActiveSession(session)
        setShowHistory(false)
    }

    const handleSessionCreated = (session: SessionWithRelations) => {
        setActiveSession(session)
        setShowHistory(false)
    }

    return (
        <div className="space-y-6">
            {/* ── En-tête ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {showHistory && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowHistory(false)}
                            className="h-8 w-8"
                        >
                            <ArrowLeft className="h-4 w-4"/>
                        </Button>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {showHistory ? 'Historique de caisse' : 'Caisse'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {showHistory
                                ? 'Cliquez sur un jour pour voir ou saisir une session'
                                : new Date().toLocaleDateString('fr-FR', {
                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                })
                            }
                        </p>
                    </div>
                </div>

                <Button
                    variant={showHistory ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="gap-2"
                >
                    <CalendarDays className="h-4 w-4"/>
                    {showHistory ? 'Retour au jour actuel' : 'Historique'}
                    {/* Badge qui indique le nombre de sessions historiques non clôturées */}
                    {!showHistory && recentSessions.filter(s => s.status === 'open').length > 0 && (
                        <Badge variant="destructive" className="h-4 px-1 text-xs">
                            {recentSessions.filter(s => s.status === 'open').length}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* ── Corps principal ── */}
            {showHistory ? (
                <HistoryCalendar
                    sessions={recentSessions}
                    products={products}
                    restaurantId={restaurantId}
                    onSelectSession={handleSelectSession}
                />
            ) : (
                <>
                    {/* Aucune session ouverte aujourd'hui */}
                    {!activeSession && (
                        <OpenSessionCard
                            restaurantId={restaurantId}
                            onSessionCreated={handleSessionCreated}
                        />
                    )}

                    {/* Session ouverte → interface de saisie active */}
                    {activeSession?.status === 'open' && (
                        <SessionDashboard
                            session={activeSession}
                            products={products}
                            onSessionUpdated={setActiveSession}
                        />
                    )}

                    {/* Session clôturée → lecture seule avec résumé */}
                    {activeSession?.status === 'closed' && (
                        <SessionSummary session={activeSession}/>
                    )}
                </>
            )}
        </div>
    )
}
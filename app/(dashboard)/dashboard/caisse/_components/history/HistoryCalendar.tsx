'use client'

import {useState, useMemo} from 'react'
import {ChevronLeft, ChevronRight} from 'lucide-react'
import {toast} from 'sonner'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {cn} from '@/lib/utils'
import {getCashSession} from '@/lib/actions/cash/get-session'
import type {
    SessionSummary,
    SessionWithRelations,
    ProductWithStock,
} from '../../_types'

interface HistoryCalendarProps {
    sessions: SessionSummary[]
    products: ProductWithStock[]
    restaurantId: string
    onSelectSession: (session: SessionWithRelations) => void
}

const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
    return (new Date(year, month, 1).getDay() + 6) % 7
}

export function HistoryCalendar({
                                    sessions,
                                    onSelectSession,
                                }: HistoryCalendarProps) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const [displayYear, setDisplayYear] = useState(now.getFullYear())
    const [displayMonth, setDisplayMonth] = useState(now.getMonth())
    const [loadingDay, setLoadingDay] = useState<string | null>(null)

    // 🔥 Optimisé
    const sessionsByDate = useMemo(() => {
        const map = new Map<string, SessionSummary>()
        sessions.forEach(s => {
            const key = new Date(s.sessionDate).toISOString().split('T')[0]
            map.set(key, s)
        })
        return map
    }, [sessions])

    const daysInMonth = getDaysInMonth(displayYear, displayMonth)
    const firstDay = getFirstDayOfMonth(displayYear, displayMonth)

    const monthSessions = sessions.filter(s => {
        const d = new Date(s.sessionDate)
        return d.getFullYear() === displayYear && d.getMonth() === displayMonth
    })

    function prevMonth() {
        if (displayMonth === 0) {
            setDisplayMonth(11)
            setDisplayYear(y => y - 1)
        } else setDisplayMonth(m => m - 1)
    }

    function nextMonth() {
        if (
            displayYear === now.getFullYear() &&
            displayMonth === now.getMonth()
        ) return

        if (displayMonth === 11) {
            setDisplayMonth(0)
            setDisplayYear(y => y + 1)
        } else setDisplayMonth(m => m + 1)
    }

    async function handleDayClick(day: number) {
        const dateStr = [
            displayYear,
            String(displayMonth + 1).padStart(2, '0'),
            String(day).padStart(2, '0'),
        ].join('-')

        const existing = sessionsByDate.get(dateStr)
        if (!existing) return

        setLoadingDay(dateStr)
        try {
            const session = await getCashSession(existing.id)
            onSelectSession(session as SessionWithRelations)
        } catch (e: any) {
            toast.error(e.message ?? 'Impossible de charger cette session')
        } finally {
            setLoadingDay(null)
        }
    }

    function getStatusStyle(session?: SessionSummary) {
        if (!session) return ''

        if (session.status === 'open')
            return 'bg-muted border-border'

        if (Math.abs(session.balanceDifference ?? 0) > 500)
            return 'bg-destructive/10 border-destructive/40 text-destructive'

        return 'bg-primary/10 border-primary/40 text-primary'
    }

    return (
        <div className="space-y-6">
            {/* CALENDAR */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4"/>
                        </Button>

                        <CardTitle className="text-base font-semibold">
                            {MONTH_NAMES[displayMonth]} {displayYear}
                        </CardTitle>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextMonth}
                            disabled={
                                displayYear === now.getFullYear() &&
                                displayMonth === now.getMonth()
                            }
                        >
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {DAY_NAMES.map(d => (
                            <div
                                key={d}
                                className="text-center text-xs font-medium text-muted-foreground py-1"
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({length: firstDay}).map((_, i) => (
                            <div key={i}/>
                        ))}

                        {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => {
                            const dateStr = [
                                displayYear,
                                String(displayMonth + 1).padStart(2, '0'),
                                String(day).padStart(2, '0'),
                            ].join('-')

                            const session = sessionsByDate.get(dateStr)
                            const isFuture = dateStr > today
                            const isToday = dateStr === today
                            const isLoading = loadingDay === dateStr

                            return (
                                <button
                                    key={day}
                                    onClick={() =>
                                        !isFuture && !isLoading && handleDayClick(day)
                                    }
                                    disabled={isFuture || isLoading}
                                    className={cn(
                                        'aspect-square rounded-xl border text-sm transition-all duration-200',
                                        'flex flex-col items-center justify-center bg-card',
                                        'hover:scale-[1.03]',
                                        isFuture && 'opacity-30 cursor-not-allowed border-transparent',
                                        session && getStatusStyle(session),
                                        isToday && 'ring-2 ring-primary ring-offset-2',
                                        isLoading && 'opacity-60 cursor-wait'
                                    )}
                                >
                                    {isLoading ? (
                                        <span
                                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                                    ) : (
                                        <>
                                            <span className="text-xs font-semibold">{day}</span>
                                            {session && (
                                                <span
                                                    className={cn(
                                                        'w-1.5 h-1.5 rounded-full mt-1',
                                                        session.status === 'open'
                                                            ? 'bg-muted-foreground'
                                                            : Math.abs(session.balanceDifference ?? 0) > 500
                                                                ? 'bg-destructive'
                                                                : 'bg-primary'
                                                    )}
                                                />
                                            )}
                                        </>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-6">
                        <Badge variant="secondary">Clôturée OK</Badge>
                        <Badge variant="destructive">Écart détecté</Badge>
                        <Badge variant="outline">Ouverte</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* MONTH SUMMARY */}
            {monthSessions.length > 0 && (
                <Card className="shadow-sm">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-xs text-muted-foreground">Sessions</p>
                                <p className="text-2xl font-bold">
                                    {monthSessions.length}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Avec écart
                                </p>
                                <p className="text-2xl font-bold text-destructive">
                                    {
                                        monthSessions.filter(
                                            s => Math.abs(s.balanceDifference ?? 0) > 500
                                        ).length
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Clôturées
                                </p>
                                <p className="text-2xl font-bold text-primary">
                                    {
                                        monthSessions.filter(
                                            s => s.status === 'closed'
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
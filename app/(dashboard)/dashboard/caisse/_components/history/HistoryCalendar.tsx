// app/(dashboard)/caisse/_components/history/HistoryCalendar.tsx
'use client'

import {useState, useMemo} from 'react'
import {
    ChevronLeft, ChevronRight, Calendar, Table2,
    Search, Filter, CheckCircle2, AlertTriangle,
    Clock, ArrowUpDown, TrendingDown,
} from 'lucide-react'
import {toast} from 'sonner'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs'
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

function formatAmount(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

// Fonction centrale pour déterminer si une session a un écart significatif.
// On considère qu'il y a écart uniquement si la session est clôturée
// ET que balanceDifference est renseigné ET que sa valeur absolue dépasse 500.
// Une session ouverte n'a pas encore d'écart — il sera calculé à la clôture.
function hasSignificantGap(session: SessionSummary): boolean {
    return (
        session.status === 'closed' &&
        session.balanceDifference !== null &&
        session.balanceDifference !== undefined &&
        Math.abs(session.balanceDifference) > 500
    )
}

function isClosedOk(session: SessionSummary): boolean {
    return (
        session.status === 'closed' &&
        !hasSignificantGap(session)
    )
}

type SortField = 'date' | 'opening' | 'closing' | 'difference'
type SortDir = 'asc' | 'desc'

export function HistoryCalendar({
                                    sessions,
                                    onSelectSession,
                                }: HistoryCalendarProps) {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const [view, setView] = useState<'calendar' | 'table'>('calendar')
    const [displayYear, setDisplayYear] = useState(now.getFullYear())
    const [displayMonth, setDisplayMonth] = useState(now.getMonth())
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all')
    const [filterGap, setFilterGap] = useState<'all' | 'ok' | 'gap'>('all')
    const [sortField, setSortField] = useState<SortField>('date')
    const [sortDir, setSortDir] = useState<SortDir>('desc')

    // Index par date pour le calendrier — O(1) lors du rendu de chaque case
    const sessionsByDate = useMemo(() => {
        const map = new Map<string, SessionSummary>()
        sessions.forEach(s => {
            // On normalise la date en ignorant l'heure pour éviter les décalages UTC
            const d = new Date(s.sessionDate)
            const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
            map.set(key, s)
        })
        return map
    }, [sessions])

    // Sessions filtrées et triées pour la vue tableau
    const filteredSessions = useMemo(() => {
        let list = [...sessions]

        // Recherche par date au format français (ex: "15/01" ou "janvier")
        if (search.trim()) {
            const q = search.trim().toLowerCase()
            list = list.filter(s => {
                const formatted = new Date(s.sessionDate)
                    .toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})
                    .toLowerCase()
                const short = new Date(s.sessionDate)
                    .toLocaleDateString('fr-FR')
                return formatted.includes(q) || short.includes(q)
            })
        }

        // Filtre statut
        if (filterStatus !== 'all') {
            list = list.filter(s => s.status === filterStatus)
        }

        // Filtre écart — on utilise les fonctions centralisées pour la cohérence
        if (filterGap === 'ok') {
            // Sessions clôturées sans écart significatif
            list = list.filter(s => isClosedOk(s))
        } else if (filterGap === 'gap') {
            // Sessions clôturées avec écart > 500 FCFA (en valeur absolue)
            list = list.filter(s => hasSignificantGap(s))
        }

        // Tri
        list.sort((a, b) => {
            let valA: number
            let valB: number
            switch (sortField) {
                case 'date':
                    valA = new Date(a.sessionDate).getTime()
                    valB = new Date(b.sessionDate).getTime()
                    break
                case 'opening':
                    valA = a.openingBalance
                    valB = b.openingBalance
                    break
                case 'closing':
                    valA = a.closingBalance ?? 0
                    valB = b.closingBalance ?? 0
                    break
                case 'difference':
                    // Tri par valeur absolue de l'écart — les plus grands écarts en premier
                    valA = Math.abs(a.balanceDifference ?? 0)
                    valB = Math.abs(b.balanceDifference ?? 0)
                    break
                default:
                    valA = 0;
                    valB = 0
            }
            return sortDir === 'asc' ? valA - valB : valB - valA
        })

        return list
    }, [sessions, search, filterStatus, filterGap, sortField, sortDir])

    function toggleSort(field: SortField) {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else {
            setSortField(field);
            setSortDir('desc')
        }
    }

    async function loadSession(sessionId: string) {
        setLoadingId(sessionId)
        try {
            const session = await getCashSession(sessionId)
            onSelectSession(session as SessionWithRelations)
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Impossible de charger cette session'
            toast.error(message)
        } finally {
            setLoadingId(null)
        }
    }

    async function handleDayClick(day: number) {
        const dateStr = [
            displayYear,
            String(displayMonth + 1).padStart(2, '0'),
            String(day).padStart(2, '0'),
        ].join('-')
        const existing = sessionsByDate.get(dateStr)
        if (!existing) return
        await loadSession(existing.id)
    }

    const monthSessions = sessions.filter(s => {
        const d = new Date(s.sessionDate)
        return d.getUTCFullYear() === displayYear && d.getUTCMonth() === displayMonth
    })

    // Couleurs distinctes pour le calendrier.
    // Rouge vif pour les écarts — c'est une alerte visuelle, pas juste une nuance.
    // Vert pour les sessions OK — signal positif immédiat.
    // Gris neutre pour les sessions ouvertes — pas encore de verdict.
    function getDayClasses(session?: SessionSummary) {
        if (!session) return 'border-transparent'
        if (session.status === 'open')
            return 'bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-600'
        if (hasSignificantGap(session))
            return 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/40 dark:border-red-500'
        return 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500'
    }

    function getDotColor(session: SessionSummary) {
        if (session.status === 'open') return 'bg-slate-400'
        if (hasSignificantGap(session)) return 'bg-red-600'
        return 'bg-emerald-600'
    }

    function getStatusBadge(session: SessionSummary) {
        if (session.status === 'open')
            return <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3"/>Ouverte</Badge>
        if (hasSignificantGap(session))
            return <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle
                className="h-3 w-3"/>Écart</Badge>
        return <Badge className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-600 text-white"><CheckCircle2
            className="h-3 w-3"/>OK</Badge>
    }

    // Statistiques pour le résumé en bas du calendrier
    const gapCount = monthSessions.filter(hasSignificantGap).length
    const closedCount = monthSessions.filter(s => s.status === 'closed').length

    return (
        <div className="space-y-4">
            {/* Sélecteur de vue */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {sessions.length} session{sessions.length > 1 ? 's' : ''} enregistrée{sessions.length > 1 ? 's' : ''}
                </p>
                <Tabs value={view} onValueChange={v => setView(v as 'calendar' | 'table')}>
                    <TabsList>
                        <TabsTrigger value="calendar" className="gap-2">
                            <Calendar className="h-4 w-4"/>
                            Calendrier
                        </TabsTrigger>
                        <TabsTrigger value="table" className="gap-2">
                            <Table2 className="h-4 w-4"/>
                            Tableau
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* ══════════════════════════════════════
          VUE CALENDRIER
      ══════════════════════════════════════ */}
            {view === 'calendar' && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" size="icon" onClick={() => {
                                    if (displayMonth === 0) {
                                        setDisplayMonth(11);
                                        setDisplayYear(y => y - 1)
                                    } else setDisplayMonth(m => m - 1)
                                }}>
                                    <ChevronLeft className="h-4 w-4"/>
                                </Button>
                                <CardTitle className="text-base font-semibold">
                                    {MONTH_NAMES[displayMonth]} {displayYear}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={displayYear === now.getFullYear() && displayMonth === now.getMonth()}
                                    onClick={() => {
                                        if (displayMonth === 11) {
                                            setDisplayMonth(0);
                                            setDisplayYear(y => y + 1)
                                        } else setDisplayMonth(m => m + 1)
                                    }}
                                >
                                    <ChevronRight className="h-4 w-4"/>
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* En-têtes */}
                            <div className="grid grid-cols-7">
                                {DAY_NAMES.map(d => (
                                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Grille des jours */}
                            <div className="grid grid-cols-7 gap-1.5">
                                {Array.from({length: getFirstDayOfMonth(displayYear, displayMonth)}).map((_, i) => (
                                    <div key={`e-${i}`}/>
                                ))}

                                {Array.from({length: getDaysInMonth(displayYear, displayMonth)}, (_, i) => i + 1).map(day => {
                                    const dateStr = [
                                        displayYear,
                                        String(displayMonth + 1).padStart(2, '0'),
                                        String(day).padStart(2, '0'),
                                    ].join('-')

                                    const session = sessionsByDate.get(dateStr)
                                    const isFuture = dateStr > today
                                    const isToday = dateStr === today
                                    const isLoading = session ? loadingId === session.id : false

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => !isFuture && !isLoading && session && handleDayClick(day)}
                                            disabled={isFuture || isLoading || !session}
                                            className={cn(
                                                'aspect-square rounded-xl border-2 text-sm transition-all duration-150',
                                                'flex flex-col items-center justify-center',
                                                getDayClasses(session),
                                                !session && !isFuture && 'border-transparent text-muted-foreground/30',
                                                isFuture && 'opacity-20 cursor-not-allowed border-transparent',
                                                session && !isFuture && 'cursor-pointer hover:scale-105 hover:shadow-md',
                                                isToday && 'ring-2 ring-offset-2 ring-primary',
                                                isLoading && 'opacity-60 cursor-wait',
                                            )}
                                        >
                                            {isLoading ? (
                                                <span
                                                    className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                                            ) : (
                                                <>
                                                    <span className="text-xs font-bold">{day}</span>
                                                    {session && (
                                                        <span
                                                            className={cn('w-2 h-2 rounded-full mt-0.5', getDotColor(session))}/>
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Légende — avec exemples visuels pour que ce soit immédiatement clair */}
                            <div className="flex flex-wrap items-center gap-4 pt-3 border-t text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"/>
                  <span className="text-muted-foreground">Clôturée sans écart</span>
                </span>
                                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-600"/>
                  <span className="text-muted-foreground">Écart &gt; 500 FCFA</span>
                </span>
                                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-400"/>
                  <span className="text-muted-foreground">Ouverte</span>
                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Résumé du mois */}
                    {monthSessions.length > 0 && (
                        <Card>
                            <CardContent className="pt-5">
                                <div className="grid grid-cols-3 gap-4 text-center divide-x">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Sessions</p>
                                        <p className="text-2xl font-bold">{monthSessions.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Avec écart</p>
                                        <p className={cn('text-2xl font-bold', gapCount > 0 ? 'text-red-600' : 'text-muted-foreground')}>
                                            {gapCount}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Clôturées</p>
                                        <p className="text-2xl font-bold text-emerald-600">{closedCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════
          VUE TABLEAU
      ══════════════════════════════════════ */}
            {view === 'table' && (
                <div className="space-y-3">
                    {/* Barre de filtres */}
                    <Card>
                        <CardContent className="pt-4 pb-4 space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        placeholder="Rechercher une date (ex: 15/01 ou janvier)..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <Select value={filterStatus}
                                        onValueChange={v => setFilterStatus(v as typeof filterStatus)}>
                                    <SelectTrigger className="w-full sm:w-44">
                                        <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0"/>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les statuts</SelectItem>
                                        <SelectItem value="open">Ouvertes</SelectItem>
                                        <SelectItem value="closed">Clôturées</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filterGap} onValueChange={v => setFilterGap(v as typeof filterGap)}>
                                    <SelectTrigger className="w-full sm:w-44">
                                        <TrendingDown className="h-4 w-4 mr-2 text-muted-foreground shrink-0"/>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les écarts</SelectItem>
                                        <SelectItem value="ok">Sans écart (≤ 500 FCFA)</SelectItem>
                                        <SelectItem value="gap">Avec écart (&gt; 500 FCFA)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Indicateur de résultats — aide l'utilisateur à comprendre ce qu'il voit */}
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    <span
                                        className="font-medium text-foreground">{filteredSessions.length}</span> résultat{filteredSessions.length > 1 ? 's' : ''}
                                    {filteredSessions.length !== sessions.length && (
                                        <span> sur {sessions.length} sessions</span>
                                    )}
                                </p>
                                {(search || filterStatus !== 'all' || filterGap !== 'all') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={() => {
                                            setSearch('');
                                            setFilterStatus('all');
                                            setFilterGap('all')
                                        }}
                                    >
                                        Réinitialiser les filtres
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tableau */}
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>
                                            <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium"
                                                    onClick={() => toggleSort('date')}>
                                                Date
                                                <ArrowUpDown
                                                    className={cn('h-3.5 w-3.5', sortField === 'date' ? 'text-primary' : 'text-muted-foreground')}/>
                                            </Button>
                                        </TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="hidden sm:table-cell">
                                            <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium"
                                                    onClick={() => toggleSort('opening')}>
                                                Fond ouverture
                                                <ArrowUpDown
                                                    className={cn('h-3.5 w-3.5', sortField === 'opening' ? 'text-primary' : 'text-muted-foreground')}/>
                                            </Button>
                                        </TableHead>
                                        <TableHead className="hidden md:table-cell">
                                            <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium"
                                                    onClick={() => toggleSort('closing')}>
                                                Compté
                                                <ArrowUpDown
                                                    className={cn('h-3.5 w-3.5', sortField === 'closing' ? 'text-primary' : 'text-muted-foreground')}/>
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-medium"
                                                    onClick={() => toggleSort('difference')}>
                                                Écart
                                                <ArrowUpDown
                                                    className={cn('h-3.5 w-3.5', sortField === 'difference' ? 'text-primary' : 'text-muted-foreground')}/>
                                            </Button>
                                        </TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filteredSessions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Filter className="h-8 w-8 text-muted-foreground/40"/>
                                                    <p>Aucune session ne correspond aux filtres.</p>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSearch('');
                                                            setFilterStatus('all');
                                                            setFilterGap('all')
                                                        }}
                                                    >
                                                        Réinitialiser les filtres
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSessions.map(session => {
                                            const isLoading = loadingId === session.id
                                            const diff = session.balanceDifference ?? 0
                                            const hasGap = hasSignificantGap(session)

                                            return (
                                                <TableRow
                                                    key={session.id}
                                                    className={cn(
                                                        'cursor-pointer transition-colors',
                                                        hasGap && 'bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20',
                                                        !hasGap && 'hover:bg-muted/40',
                                                    )}
                                                    onClick={() => !isLoading && loadSession(session.id)}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div>
                                                            <p className="text-sm capitalize">
                                                                {new Date(session.sessionDate).toLocaleDateString('fr-FR', {
                                                                    weekday: 'short', day: 'numeric', month: 'short',
                                                                })}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(session.sessionDate).getFullYear()}
                                                            </p>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {getStatusBadge(session)}
                                                            {session.isHistorical && (
                                                                <Badge variant="outline"
                                                                       className="text-xs hidden sm:inline-flex">
                                                                    Historique
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="hidden sm:table-cell tabular-nums text-sm">
                                                        {formatAmount(session.openingBalance)}
                                                    </TableCell>

                                                    <TableCell className="hidden md:table-cell tabular-nums text-sm">
                                                        {session.closingBalance != null
                                                            ? formatAmount(session.closingBalance)
                                                            : <span className="text-muted-foreground">—</span>
                                                        }
                                                    </TableCell>

                                                    <TableCell>
                                                        {session.status === 'closed' && session.balanceDifference != null ? (
                                                            <div>
                                <span className={cn(
                                    'text-sm font-semibold tabular-nums',
                                    Math.abs(diff) === 0 ? 'text-emerald-600' :
                                        Math.abs(diff) <= 500 ? 'text-amber-600' :
                                            'text-red-600',
                                )}>
                                  {diff > 0 ? '+' : ''}{formatAmount(diff)}
                                </span>
                                                                {hasGap && (
                                                                    <p className="text-xs text-red-500 mt-0.5">⚠ À
                                                                        vérifier</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">—</span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isLoading}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                loadSession(session.id)
                                                            }}
                                                        >
                                                            {isLoading
                                                                ? <span
                                                                    className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                                                                : 'Voir →'
                                                            }
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
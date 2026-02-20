// app/dashboard/caisse/_components/SessionSummary.tsx
import {CheckCircle2, AlertTriangle, XCircle, History} from 'lucide-react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {cn} from '@/lib/utils'
import {RevenueList} from './revenues/RevenueList'
import {ExpenseList} from './expenses/ExpenseList'
import type {SessionWithRelations} from '../_types'

function formatAmount(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export function SessionSummary({session}: { session: SessionWithRelations }) {
    // Typage explicite des paramètres des callbacks reduce.
    // TypeScript ne peut pas inférer le type de 's' et 'r'/'e' tout seul
    // quand le tableau vient d'une relation Prisma — il faut l'aider.
    const totalRevenues = session.manualRevenues.reduce(
        (s: number, r: { totalAmount: number }) => s + r.totalAmount, 0
    )
    const totalExpenses = session.expenses.reduce(
        (s: number, e: { amount: number }) => s + e.amount, 0
    )

    const diff = session.balanceDifference ?? 0
    const TOLERANCE = 500

    const diffStatus =
        Math.abs(diff) === 0 ? 'perfect' :
            Math.abs(diff) <= TOLERANCE ? 'minor' : 'major'

    return (
        <div className="space-y-4">
            {/* Bannière session clôturée */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0"/>
                <div className="flex-1">
                    <p className="text-sm font-medium">Session clôturée</p>
                    <p className="text-xs text-muted-foreground">
                        {new Date(session.sessionDate).toLocaleDateString('fr-FR', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                        {session.isHistorical && (
                            <span className="ml-2">
                <Badge variant="secondary" className="text-xs">
                  <History className="h-3 w-3 mr-1"/>
                  Historique
                </Badge>
              </span>
                        )}
                    </p>
                </div>
                {session.closedAt && (
                    <p className="text-xs text-muted-foreground">
                        {new Date(session.closedAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                )}
            </div>

            {/* Résumé financier */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Résumé financier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        {label: "Fond d'ouverture", value: session.openingBalance},
                        {label: 'Recettes manuelles', value: totalRevenues, positive: true},
                        {label: 'Dépenses', value: totalExpenses, negative: true},
                        {label: 'Balance théorique', value: session.theoreticalBalance ?? 0, bold: true},
                    ].map(row => (
                        <div key={row.label} className="flex justify-between items-center py-0.5">
              <span className={cn('text-sm', row.bold && 'font-semibold')}>
                {row.label}
              </span>
                            <span className={cn(
                                'text-sm tabular-nums',
                                row.bold && 'font-bold text-base text-primary',
                                row.positive && 'text-emerald-600 font-medium',
                                row.negative && 'text-red-500 font-medium',
                            )}>
                {row.positive ? '+' : row.negative ? '-' : ''}
                                {formatAmount(row.value)}
              </span>
                        </div>
                    ))}

                    <Separator/>

                    {/* Écart */}
                    <div className={cn(
                        'flex items-center gap-3 p-3 rounded-lg',
                        diffStatus === 'perfect' && 'bg-emerald-50 text-emerald-700',
                        diffStatus === 'minor' && 'bg-amber-50 text-amber-700',
                        diffStatus === 'major' && 'bg-red-50 text-red-700',
                    )}>
                        {diffStatus === 'perfect' && <CheckCircle2 className="h-4 w-4 shrink-0"/>}
                        {diffStatus === 'minor' && <AlertTriangle className="h-4 w-4 shrink-0"/>}
                        {diffStatus === 'major' && <XCircle className="h-4 w-4 shrink-0"/>}
                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                Compté : {formatAmount(session.closingBalance ?? 0)}
                            </p>
                            <p className="text-xs">
                                Écart : {diff >= 0 ? '+' : ''}{formatAmount(Math.abs(diff))}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Détail des transactions */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            💰 Recettes ({session.manualRevenues.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RevenueList revenues={session.manualRevenues}/>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            💸 Dépenses ({session.expenses.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ExpenseList expenses={session.expenses}/>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
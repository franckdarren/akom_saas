// app/dashboard/caisse/_components/revenues/RevenueList.tsx
import {Badge} from '@/components/ui/badge'
import {EmptyState} from '@/components/ui/empty-state'
import {cn} from '@/lib/utils'
import type {SessionWithRelations} from '../../_types'

type Revenue = SessionWithRelations['manualRevenues'][number]

const METHOD_LABELS: Record<string, string> = {
    cash: '💵 Cash',
    airtel_money: '📱 Airtel',
    moov_money: '📱 Moov',
}

export function RevenueList({revenues}: { revenues: Revenue[] }) {
    if (revenues.length === 0) {
        return (
            <EmptyState title="Aucune recette enregistrée pour l'instant"/>
        )
    }

    return (
        <div className="space-y-3">
            {revenues.map((r) => (
                <div
                    key={r.id}
                    className={cn(
                        'flex items-start justify-between rounded-xl border bg-card p-4 transition-colors',
                        'hover:bg-muted/40'
                    )}
                >
                    {/* LEFT */}
                    <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">
                            {r.description}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span>
                {METHOD_LABELS[r.paymentMethod] ?? r.paymentMethod}
              </span>

                            {r.quantity > 1 && (
                                <span>× {r.quantity}</span>
                            )}

                            {r.revenueType === 'good' && (
                                <Badge variant="secondary">
                                    📦 Bien
                                </Badge>
                            )}

                            {r.product?.name && (
                                <span>
                  → {r.product.name}
                </span>
                            )}
                        </div>
                    </div>

                    {/* RIGHT */}
                    <p className="ml-4 shrink-0 text-sm font-semibold text-primary tabular-nums">
                        +{new Intl.NumberFormat('fr-FR').format(r.totalAmount)} FCFA
                    </p>
                </div>
            ))}
        </div>
    )
}
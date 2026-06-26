// app/dashboard/caisse/_components/expenses/ExpenseList.tsx
import {Badge} from '@/components/ui/badge'
import {EmptyState} from '@/components/ui/empty-state'
import {cn} from '@/lib/utils'
import type {SessionWithRelations} from '../../_types'

type Expense = SessionWithRelations['expenses'][number]

const CATEGORY_LABELS: Record<string, string> = {
    stock_purchase: '📦 Marchandises',
    salary: 'Salaire',
    utilities: 'Charges',
    transport: 'Transport',
    maintenance: 'Entretien',
    marketing: 'Marketing',
    rent: 'Loyer',
    other: 'Autres',
}

const METHOD_LABELS: Record<string, string> = {
    cash: '💵 Cash',
    airtel_money: '📱 Airtel',
    moov_money: '📱 Moov',
}

export function ExpenseList({expenses}: { expenses: Expense[] }) {
    if (expenses.length === 0) {
        return (
            <EmptyState title="Aucune dépense enregistrée pour l'instant"/>
        )
    }

    return (
        <div className="space-y-3">
            {expenses.map((e) => (
                <div
                    key={e.id}
                    className={cn(
                        'flex items-start justify-between rounded-xl border bg-card p-4 transition-colors',
                        'hover:bg-muted/40'
                    )}
                >
                    {/* LEFT */}
                    <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">
                            {e.description}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span>
                {CATEGORY_LABELS[e.category] ?? e.category}
              </span>

                            <span>
                {METHOD_LABELS[e.paymentMethod] ?? e.paymentMethod}
              </span>

                            {e.product?.name && (
                                <Badge variant="secondary">
                                    → {e.product.name} (+{e.quantityAdded})
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* RIGHT */}
                    <p className="ml-4 shrink-0 text-sm font-semibold text-destructive tabular-nums">
                        -{new Intl.NumberFormat('fr-FR').format(e.amount)} FCFA
                    </p>
                </div>
            ))}
        </div>
    )
}
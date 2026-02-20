// app/dashboard/caisse/_components/expenses/ExpensePanel.tsx
'use client'

import {useState, useMemo} from 'react'
import {Plus} from 'lucide-react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {ScrollArea} from '@/components/ui/scroll-area'
import {AddExpenseForm} from './AddExpenseForm'
import {ExpenseList} from './ExpenseList'
import type {SessionWithRelations, ProductWithStock} from '../../_types'

interface ExpensePanelProps {
    session: SessionWithRelations
    products: ProductWithStock[]
    onActionCompleted: () => void
}

export function ExpensePanel({
                                 session,
                                 products,
                                 onActionCompleted,
                             }: ExpensePanelProps) {
    const [showForm, setShowForm] = useState(false)

    const total = useMemo(
        () => session.expenses.reduce(
            (s: number, e: { amount: number }) => s + e.amount, 0
        ),
        [session.expenses]
    )

    function handleAdded() {
        setShowForm(false)
        onActionCompleted()
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        💸 Dépenses
                        <span className="text-sm font-normal text-muted-foreground">
              ({session.expenses.length})
            </span>
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-lg font-bold text-destructive tabular-nums">
                            -{new Intl.NumberFormat('fr-FR').format(total)} FCFA
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 flex-1 min-h-0">
                {showForm ? (
                    <AddExpenseForm
                        sessionId={session.id}
                        products={products}
                        onAdded={handleAdded}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    <Button
                        onClick={() => setShowForm(true)}
                        variant="destructive"
                        className="w-full gap-2"
                    >
                        <Plus className="h-4 w-4"/>
                        Ajouter une dépense
                    </Button>
                )}

                <Separator/>

                <ScrollArea className="flex-1 pr-3">
                    <ExpenseList expenses={session.expenses}/>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
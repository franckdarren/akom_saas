// app/dashboard/caisse/_components/revenues/RevenuePanel.tsx
'use client'

import {useState, useMemo} from 'react'
import {Plus} from 'lucide-react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {ScrollArea} from '@/components/ui/scroll-area'
import {AddRevenueForm} from './AddRevenueForm'
import {RevenueList} from './RevenueList'
import type {SessionWithRelations, ProductWithStock} from '../../_types'

interface RevenuePanelProps {
    session: SessionWithRelations
    products: ProductWithStock[]
    onActionCompleted: () => void
}

export function RevenuePanel({
                                 session,
                                 products,
                                 onActionCompleted,
                             }: RevenuePanelProps) {
    const [showForm, setShowForm] = useState(false)

    const total = useMemo(
        () => session.manualRevenues.reduce(
            (s: number, r: { totalAmount: number }) => s + r.totalAmount, 0
        ),
        [session.manualRevenues]
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
                        💰 Recettes
                        <span className="text-sm font-normal text-muted-foreground">
              ({session.manualRevenues.length})
            </span>
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-lg font-bold text-primary tabular-nums">
                            +{new Intl.NumberFormat('fr-FR').format(total)} FCFA
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 flex-1 min-h-0">
                {showForm ? (
                    <AddRevenueForm
                        sessionId={session.id}
                        products={products}
                        onAdded={handleAdded}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    <Button
                        onClick={() => setShowForm(true)}
                        variant="default"
                        className="w-full gap-2"
                    >
                        <Plus className="h-4 w-4"/>
                        Ajouter une recette
                    </Button>
                )}

                <Separator/>

                <ScrollArea className="flex-1 pr-3">
                    <RevenueList revenues={session.manualRevenues}/>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
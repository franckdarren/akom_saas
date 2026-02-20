'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Lock} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {BalanceCard} from './balance/BalanceCard'
import {RevenuePanel} from './revenues/RevenuePanel'
import {ExpensePanel} from './expenses/ExpensePanel'
import {CloseSessionDialog} from './balance/CloseSessionDialog'
import {cn} from '@/lib/utils'
import type {SessionWithRelations, ProductWithStock} from '../_types'

interface SessionDashboardProps {
    session: SessionWithRelations
    products: ProductWithStock[]
    onSessionUpdated: (session: SessionWithRelations) => void
}

export function SessionDashboard({
                                     session,
                                     products,
                                     onSessionUpdated,
                                 }: SessionDashboardProps) {
    const router = useRouter()
    const [showCloseDialog, setShowCloseDialog] = useState(false)

    const manualRevenues = session.manualRevenues ?? []
    const expenses = session.expenses ?? []

    function handleActionCompleted() {
        router.refresh()
    }

    return (
        <div className="space-y-4">
            {/* Badge session historique */}
            {session.isHistorical && (
                <div
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm w-fit',
                        'bg-accent/5 border-accent/10 text-accent-foreground'
                    )}
                >
                    <span>📅</span>
                    <span>
            Saisie historique —{' '}
                        <strong>
              {new Date(session.sessionDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
              })}
            </strong>
          </span>
                </div>
            )}

            {/* Widget de balance */}
            <BalanceCard session={{...session, manualRevenues, expenses}}/>

            {/* Desktop : deux colonnes */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-4">
                <RevenuePanel
                    session={{...session, manualRevenues, expenses}}
                    products={products}
                    onActionCompleted={handleActionCompleted}
                />
                <ExpensePanel
                    session={{...session, manualRevenues, expenses}}
                    products={products}
                    onActionCompleted={handleActionCompleted}
                />
            </div>

            {/* Mobile : onglets */}
            <div className="md:hidden">
                <Tabs defaultValue="revenues">
                    <TabsList className="w-full">
                        <TabsTrigger value="revenues" className="flex-1">
                            💰 Recettes ({manualRevenues.length})
                        </TabsTrigger>
                        <TabsTrigger value="expenses" className="flex-1">
                            💸 Dépenses ({expenses.length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="revenues" className="mt-4">
                        <RevenuePanel
                            session={{...session, manualRevenues, expenses}}
                            products={products}
                            onActionCompleted={handleActionCompleted}
                        />
                    </TabsContent>
                    <TabsContent value="expenses" className="mt-4">
                        <ExpensePanel
                            session={{...session, manualRevenues, expenses}}
                            products={products}
                            onActionCompleted={handleActionCompleted}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Bouton de clôture */}
            <div className="flex justify-end pt-2">
                <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowCloseDialog(true)}
                >
                    <Lock className="h-4 w-4"/>
                    Clôturer la caisse
                </Button>
            </div>

            <CloseSessionDialog
                session={{...session, manualRevenues, expenses}}
                open={showCloseDialog}
                onOpenChange={setShowCloseDialog}
                onSessionClosed={onSessionUpdated}
            />
        </div>
    )
}
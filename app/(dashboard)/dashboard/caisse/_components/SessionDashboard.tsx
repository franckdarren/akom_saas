// app/(dashboard)/caisse/_components/SessionDashboard.tsx
'use client'

import {useState, useTransition} from 'react'
import {Lock} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {BalanceCard} from './balance/BalanceCard'
import {RevenuePanel} from './revenues/RevenuePanel'
import {ExpensePanel} from './expenses/ExpensePanel'
import {CloseSessionDialog} from './balance/CloseSessionDialog'
import {cn} from '@/lib/utils'
import {getCashSession} from '@/lib/actions/cash/get-session'
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
    const [showCloseDialog, setShowCloseDialog] = useState(false)
    const [isPending, startTransition] = useTransition()

    const manualRevenues = session.manualRevenues ?? []
    const expenses = session.expenses ?? []

    // Au lieu de router.refresh() qui ne met pas à jour l'état React local,
    // on recharge la session complète depuis le serveur via la Server Action
    // et on propage les nouvelles données vers CaisseShell via onSessionUpdated.
    // Cela met à jour toute la chaîne : CaisseShell → SessionDashboard → panels.
    function handleActionCompleted() {
        startTransition(async () => {
            try {
                const updated = await getCashSession(session.id)
                onSessionUpdated(updated as SessionWithRelations)
            } catch (e) {
                console.error('Erreur rechargement session:', e)
            }
        })
    }

    return (
        <div className="space-y-4">
            {/* Badge session historique */}
            {session.isHistorical && (
                <div className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm w-fit',
                    'bg-accent/5 border-accent/10 text-accent-foreground'
                )}>
                    <span>📅</span>
                    <span>
            Saisie historique —{' '}
                        <strong>
              {new Date(session.sessionDate).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </strong>
          </span>
                </div>
            )}

            {/* Widget de balance — se met à jour automatiquement car session est en props */}
            <BalanceCard session={{...session, manualRevenues, expenses}}/>

            {/* Indicateur de chargement discret pendant le rechargement */}
            {isPending && (
                <p className="text-xs text-muted-foreground text-center animate-pulse">
                    Mise à jour en cours...
                </p>
            )}

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
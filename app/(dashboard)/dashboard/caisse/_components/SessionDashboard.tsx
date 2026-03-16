// app/(dashboard)/caisse/_components/SessionDashboard.tsx
'use client'

import {useState, useTransition} from 'react'
import {Lock, Trash2} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {BalanceCard} from './balance/BalanceCard'
import {RevenuePanel} from './revenues/RevenuePanel'
import {ExpensePanel} from './expenses/ExpensePanel'
import {CloseSessionDialog} from './balance/CloseSessionDialog'
import {cn} from '@/lib/utils'
import {getCashSession} from '@/lib/actions/cash/get-session'
import {deleteCashSession} from '@/lib/actions/cash/delete-session'
import type {SessionWithRelations, ProductWithStock} from '../_types'

interface SessionDashboardProps {
    session: SessionWithRelations
    products: ProductWithStock[]
    onSessionUpdated: (session: SessionWithRelations) => void
    onSessionDeleted: () => void
}

export function SessionDashboard({
                                     session,
                                     products,
                                     onSessionUpdated,
                                     onSessionDeleted,
                                 }: SessionDashboardProps) {
    const [showCloseDialog, setShowCloseDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isDeleting, startDeleteTransition] = useTransition()

    const manualRevenues = session.manualRevenues ?? []
    const expenses = session.expenses ?? []
    const revenueCount = manualRevenues.length
    const expenseCount = expenses.length
    const hasData = revenueCount > 0 || expenseCount > 0

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

    function handleDelete() {
        startDeleteTransition(async () => {
            try {
                await deleteCashSession(session.id)
                toast.success('Session supprimée — stocks restaurés')
                setShowDeleteDialog(false)
                onSessionDeleted()
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Erreur lors de la suppression'
                toast.error(message)
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

            <BalanceCard session={{...session, manualRevenues, expenses}}/>

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

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                >
                    <Trash2 className="h-4 w-4"/>
                    Supprimer la session
                </Button>

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

            {/* Dialog confirmation suppression */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5"/>
                            Supprimer cette session ?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm">
                                <p>
                                    Vous allez supprimer la session du{' '}
                                    <strong>
                                        {new Date(session.sessionDate).toLocaleDateString('fr-FR', {
                                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                        })}
                                    </strong>.
                                </p>

                                {hasData && (
                                    <div
                                        className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                                        ⚠️ Cette session contient{' '}
                                        {revenueCount > 0 && (
                                            <strong>{revenueCount} recette{revenueCount > 1 ? 's' : ''}</strong>
                                        )}
                                        {revenueCount > 0 && expenseCount > 0 && ' et '}
                                        {expenseCount > 0 && (
                                            <strong>{expenseCount} dépense{expenseCount > 1 ? 's' : ''}</strong>
                                        )}
                                        . Toutes ces données seront définitivement perdues.
                                    </div>
                                )}

                                <div className="p-3 rounded-lg bg-muted space-y-1">
                                    <p className="font-medium text-foreground">Ce qui sera annulé :</p>
                                    <ul className="text-muted-foreground space-y-0.5 text-xs">
                                        <li>✅ Les sorties de stock des ventes seront restaurées</li>
                                        <li>✅ Les entrées de stock des achats seront annulées</li>
                                        <li>✅ Les mouvements de stock associés seront supprimés</li>
                                    </ul>
                                </div>

                                <p className="text-muted-foreground">
                                    Cette action est <strong>irréversible</strong>.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting
                                ? <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Suppression...
                  </span>
                                : 'Oui, supprimer définitivement'
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CloseSessionDialog
                session={{...session, manualRevenues, expenses}}
                open={showCloseDialog}
                onOpenChange={setShowCloseDialog}
                onSessionClosed={onSessionUpdated}
            />
        </div>
    )
}
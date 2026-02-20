// app/dashboard/caisse/_components/balance/CloseSessionDialog.tsx
'use client'

import {useState, useTransition} from 'react'
import {toast} from 'sonner'
import {AlertTriangle, CheckCircle2, XCircle, Lock} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Separator} from '@/components/ui/separator'
import {cn} from '@/lib/utils'
import {closeCashSession} from '@/lib/actions/cash/close-session'
import type {SessionWithRelations} from '../../_types'

interface CloseSessionDialogProps {
    session: SessionWithRelations
    open: boolean
    onOpenChange: (open: boolean) => void
    onSessionClosed: (session: SessionWithRelations) => void
}

type Step = 'summary' | 'counting' | 'confirm'

function formatAmount(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export function CloseSessionDialog({
                                       session,
                                       open,
                                       onOpenChange,
                                       onSessionClosed,
                                   }: CloseSessionDialogProps) {
    const [step, setStep] = useState<Step>('summary')
    const [closingBalance, setClosingBalance] = useState('')
    const [notes, setNotes] = useState('')
    const [isPending, startTransition] = useTransition()

    const totalRevenues = session.manualRevenues.reduce((s: number, r: { totalAmount: number }) => s + r.totalAmount, 0)
    const totalExpenses = session.expenses.reduce((s: number, e: { amount: number }) => s + e.amount, 0)
    const theoretical = session.openingBalance + totalRevenues - totalExpenses

    const closingValue = parseFloat(closingBalance || '0')
    const difference = closingValue - theoretical

    const TOLERANCE = 500
    const diffStatus =
        Math.abs(difference) === 0
            ? 'perfect'
            : Math.abs(difference) <= TOLERANCE
                ? 'minor'
                : 'major'

    function handleClose(openState: boolean) {
        if (!openState) {
            setStep('summary')
            setClosingBalance('')
            setNotes('')
        }
        onOpenChange(openState)
    }

    function handleConfirm() {
        if (!closingBalance) {
            toast.error('Saisissez le montant compté dans le tiroir')
            return
        }

        startTransition(async () => {
            try {
                const result = await closeCashSession({
                    sessionId: session.id,
                    closingBalance: Math.round(closingValue),
                    notes: notes || undefined,
                })

                toast.success('Caisse clôturée avec succès')
                onSessionClosed(result.session as SessionWithRelations)
                handleClose(false)
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Une erreur est survenue'
                toast.error(message ?? 'Erreur lors de la clôture')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-muted-foreground"/>
                        Clôture de caisse
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'summary' &&
                            'Vérifiez le résumé de la journée avant de continuer.'}
                        {step === 'counting' &&
                            "Comptez physiquement l'argent dans votre tiroir."}
                        {step === 'confirm' &&
                            'Confirmez pour finaliser la clôture.'}
                    </DialogDescription>
                </DialogHeader>

                {/* STEP 1 */}
                {step === 'summary' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {[
                                {label: "Fond d'ouverture", value: session.openingBalance, neutral: true},
                                {label: 'Recettes manuelles', value: totalRevenues, positive: true},
                                {label: 'Dépenses', value: totalExpenses, negative: true},
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="flex items-center justify-between py-1"
                                >
                  <span className="text-sm text-muted-foreground">
                    {row.label}
                  </span>
                                    <span
                                        className={cn(
                                            'text-sm font-semibold tabular-nums',
                                            row.positive && 'text-emerald-600',
                                            row.negative && 'text-destructive'
                                        )}
                                    >
                    {row.positive ? '+' : row.negative ? '-' : ''}
                                        {formatAmount(row.value)}
                  </span>
                                </div>
                            ))}
                            <Separator/>
                            <div className="flex items-center justify-between py-1">
                <span className="text-sm font-semibold">
                  Balance théorique
                </span>
                                <span className="text-base font-bold text-primary tabular-nums">
                  {formatAmount(theoretical)}
                </span>
                            </div>
                        </div>

                        <Button onClick={() => setStep('counting')} className="w-full">
                            Passer au comptage →
                        </Button>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 'counting' && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="closing-balance">
                                Montant compté dans le tiroir
                            </Label>
                            <div className="relative">
                                <Input
                                    id="closing-balance"
                                    type="number"
                                    value={closingBalance}
                                    onChange={(e) => setClosingBalance(e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    className="text-2xl font-bold h-14 pr-20"
                                    autoFocus
                                />
                                <span
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  FCFA
                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep('summary')}
                                className="flex-1"
                            >
                                ← Retour
                            </Button>
                            <Button
                                onClick={() => setStep('confirm')}
                                disabled={!closingBalance}
                                className="flex-1"
                            >
                                Continuer →
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 'confirm' && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted/50 text-center">
                            <p className="text-sm text-muted-foreground">
                                Montant compté
                            </p>
                            <p className="text-3xl font-bold tabular-nums">
                                {formatAmount(closingValue)}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="close-notes">
                                Notes de clôture
                            </Label>
                            <Textarea
                                id="close-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep('counting')}
                                disabled={isPending}
                                className="flex-1"
                            >
                                ← Retour
                            </Button>

                            {/* ✅ FIX SHADCN PROPER VARIANT */}
                            <Button
                                variant="destructive"
                                onClick={handleConfirm}
                                disabled={isPending}
                                className="flex-1"
                            >
                                {isPending ? 'Clôture...' : 'Confirmer la clôture'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
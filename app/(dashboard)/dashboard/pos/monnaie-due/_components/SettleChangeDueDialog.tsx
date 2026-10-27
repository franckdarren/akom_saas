'use client'

import {useState, useTransition} from 'react'
import {toast} from 'sonner'
import {HandCoins} from 'lucide-react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {settleChangeDue} from '@/lib/actions/change-due'
import type {ChangeDueRow} from '@/types/change-due'

interface Props {
    changeDue: ChangeDueRow | null
    onClose: () => void
    onSettled: () => void
}

/**
 * Rend la monnaie au client en espèces lors d'un passage ultérieur.
 * La déduction sur un achat se fait au comptoir, pas ici : la vente et le
 * règlement doivent être enregistrés dans la même transaction.
 */
export function SettleChangeDueDialog({changeDue, onClose, onSettled}: Props) {
    const [notes, setNotes] = useState('')
    const [isPending, startTransition] = useTransition()

    function handleConfirm() {
        if (!changeDue) return

        startTransition(async () => {
            const result = await settleChangeDue({
                changeDueId: changeDue.id,
                notes: notes.trim() || undefined,
            })

            if (!result.success) {
                toast.error(result.error)
                return
            }

            toast.success(result.message ?? 'Monnaie rendue au client')
            setNotes('')
            onSettled()
        })
    }

    return (
        <Dialog open={!!changeDue} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="type-dialog-title layout-inline">
                        <HandCoins className="h-5 w-5 text-primary"/>
                        Rendre la monnaie
                    </DialogTitle>
                    <DialogDescription>
                        Confirmez uniquement après avoir remis l&apos;argent au client.
                    </DialogDescription>
                </DialogHeader>

                {changeDue && (
                    <div className="layout-form">
                        <div className="rounded-xl bg-muted/50 p-4 text-center">
                            <p className="type-label-meta">Montant à rendre</p>
                            <p className="text-3xl font-bold tabular-nums">
                                {new Intl.NumberFormat('fr-FR').format(changeDue.amount)} FCFA
                            </p>
                            <p className="type-caption mt-1">
                                Code {changeDue.code}
                                {changeDue.customerName && ` · ${changeDue.customerName}`}
                            </p>
                        </div>

                        <div className="layout-field">
                            <Label htmlFor="settle-notes" className="type-label">
                                Notes (optionnel)
                            </Label>
                            <Textarea
                                id="settle-notes"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="layout-inline">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                                disabled={isPending}
                            >
                                Annuler
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleConfirm}
                                disabled={isPending}
                            >
                                {isPending ? 'Enregistrement…' : 'Monnaie rendue'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

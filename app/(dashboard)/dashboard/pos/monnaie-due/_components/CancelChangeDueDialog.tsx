'use client'

import {useState, useTransition} from 'react'
import {toast} from 'sonner'
import {Ban} from 'lucide-react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {cancelChangeDue} from '@/lib/actions/change-due'
import type {ChangeDueRow} from '@/types/change-due'

interface Props {
    changeDue: ChangeDueRow | null
    onClose: () => void
    onCancelled: () => void
}

/**
 * Abandonne une dette dont le client ne viendra jamais réclamer la monnaie.
 * Réservé à l'admin, motif obligatoire : c'est la seule façon de faire
 * disparaître une dette sans rendre l'argent, donc la plus sensible.
 */
export function CancelChangeDueDialog({changeDue, onClose, onCancelled}: Props) {
    const [reason, setReason] = useState('')
    const [isPending, startTransition] = useTransition()

    function handleConfirm() {
        if (!changeDue) return
        if (!reason.trim()) {
            toast.error('Le motif est obligatoire')
            return
        }

        startTransition(async () => {
            const result = await cancelChangeDue({
                changeDueId: changeDue.id,
                reason: reason.trim(),
            })

            if (!result.success) {
                toast.error(result.error)
                return
            }

            toast.success(result.message ?? 'Monnaie due annulée')
            setReason('')
            onCancelled()
        })
    }

    return (
        <Dialog open={!!changeDue} onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="type-dialog-title layout-inline text-destructive">
                        <Ban className="h-5 w-5"/>
                        Annuler cette monnaie due
                    </DialogTitle>
                    <DialogDescription>
                        Le client ne pourra plus réclamer son argent avec ce code.
                        L&apos;opération est tracée et irréversible.
                    </DialogDescription>
                </DialogHeader>

                {changeDue && (
                    <div className="layout-form">
                        <div className="rounded-xl bg-muted/50 p-4 text-center">
                            <p className="text-2xl font-bold tabular-nums">
                                {new Intl.NumberFormat('fr-FR').format(changeDue.amount)} FCFA
                            </p>
                            <p className="type-caption mt-1">
                                Code {changeDue.code}
                                {changeDue.customerName && ` · ${changeDue.customerName}`}
                            </p>
                        </div>

                        <div className="layout-field">
                            <Label htmlFor="cancel-reason" className="type-label">
                                Motif de l&apos;annulation
                            </Label>
                            <Textarea
                                id="cancel-reason"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Ex : client jamais revenu depuis 6 mois"
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
                                Retour
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleConfirm}
                                disabled={isPending || !reason.trim()}
                            >
                                {isPending ? 'Annulation…' : 'Confirmer'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

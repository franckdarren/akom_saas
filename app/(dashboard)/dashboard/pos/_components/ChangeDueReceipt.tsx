'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Printer, Coins} from 'lucide-react'
import type {POSChangeDueResult} from '../_types'

interface Props {
    changeDue: POSChangeDueResult | null
    restaurantName: string
    onClose: () => void
}

/**
 * Preuve remise au client pour la monnaie que le commerçant n'a pas pu rendre.
 *
 * C'est la pièce centrale de la fonctionnalité : sans preuve en main, le client
 * n'a aucune garantie de récupérer son argent. Le code de retrait doit donc
 * rester lisible, y compris sur une impression noir et blanc.
 */
export function ChangeDueReceipt({changeDue, restaurantName, onClose}: Props) {
    if (!changeDue) return null

    const today = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    return (
        <Dialog open onOpenChange={open => !open && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="type-dialog-title layout-inline">
                        <Coins className="h-5 w-5 text-warning"/>
                        Monnaie due au client
                    </DialogTitle>
                    <DialogDescription>
                        Remettez ce ticket au client — il en a besoin pour récupérer sa monnaie.
                    </DialogDescription>
                </DialogHeader>

                {/* Bloc imprimable. L'id est repris par la règle @media print
                    de app/globals.css, qui masque tout le reste de la page. */}
                <div
                    id="change-due-receipt"
                    className="space-y-4 rounded-xl border border-dashed p-4 text-center print:border-none"
                >
                    <div className="space-y-0.5">
                        <p className="font-semibold">{restaurantName}</p>
                        <p className="type-caption">{today}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="type-label-meta">Monnaie à vous rendre</p>
                        <p className="text-3xl font-bold tabular-nums">
                            {changeDue.amount.toLocaleString('fr-FR')} FCFA
                        </p>
                    </div>

                    <div className="space-y-1">
                        <p className="type-label-meta">Code de retrait</p>
                        <p className="type-code text-2xl font-bold tracking-[0.3em]">
                            {changeDue.code}
                        </p>
                    </div>

                    <p className="type-caption">
                        À présenter lors de votre prochain passage, pour récupérer votre
                        monnaie ou la déduire d&apos;un achat.
                    </p>
                </div>

                <div className="layout-inline">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Fermer
                    </Button>
                    <Button className="flex-1 gap-2" onClick={() => window.print()}>
                        <Printer className="h-4 w-4"/>
                        Imprimer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

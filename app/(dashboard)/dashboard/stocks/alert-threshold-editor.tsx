// app/(dashboard)/dashboard/stocks/alert-threshold-editor.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Loader2 } from 'lucide-react'
import { updateAlertThreshold } from '@/lib/actions/stock'

type AlertThresholdEditorProps = {
    productId: string
    productName: string
    currentThreshold: number
}

export function AlertThresholdEditor({
    productId,
    productName,
    currentThreshold,
}: AlertThresholdEditorProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [threshold, setThreshold] = useState(currentThreshold.toString())
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Cette fonction gère la fermeture propre du dialog
    function handleOpenChange(newOpen: boolean) {
        setOpen(newOpen)
        if (!newOpen) {
            // Réinitialiser l'état quand on ferme
            setThreshold(currentThreshold.toString())
            setError(null)
            setIsLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const newThreshold = parseInt(threshold)

        // Validation côté client avant d'envoyer
        if (isNaN(newThreshold) || newThreshold < 0) {
            setError('Le seuil doit être un nombre positif')
            setIsLoading(false)
            return
        }

        const result = await updateAlertThreshold(productId, newThreshold)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            // Succès : fermer le dialog et rafraîchir la page
            setOpen(false)
            router.refresh()
            setIsLoading(false)
        }
    }

    const thresholdChanged = parseInt(threshold) !== currentThreshold

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon-sm" title="Modifier le seuil d'alerte">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Seuil d'alerte stock</DialogTitle>
                    <DialogDescription>
                        Définir le niveau de stock minimum pour {productName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Affichage du seuil actuel */}
                        <div className="bg-muted p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Seuil actuel</div>
                            <div className="text-2xl font-bold">{currentThreshold}</div>
                        </div>

                        {/* Input pour le nouveau seuil */}
                        <div className="space-y-2">
                            <Label htmlFor="threshold">
                                Nouveau seuil d'alerte (unités)
                                <span className="text-red-500"> *</span>
                            </Label>
                            <Input
                                id="threshold"
                                type="number"
                                min="0"
                                max="1000"
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                                placeholder="Ex: 10"
                                required
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground">
                                Vous serez alerté quand le stock descend à ce niveau ou en dessous
                            </p>
                        </div>

                        {/* Aperçu du changement */}
                        {thresholdChanged && !isNaN(parseInt(threshold)) && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    📊 Changement : {currentThreshold} → {parseInt(threshold)}
                                </p>
                            </div>
                        )}

                        {/* Message d'erreur */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading || !thresholdChanged}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                'Enregistrer'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
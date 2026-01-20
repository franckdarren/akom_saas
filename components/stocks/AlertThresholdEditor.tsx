'use client'

import { useState } from 'react'
import { updateAlertThreshold } from '@/lib/actions/stock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Settings } from 'lucide-react'

interface AlertThresholdEditorProps {
    productId: string
    productName: string
    currentThreshold: number
}

export function AlertThresholdEditor({
    productId,
    productName,
    currentThreshold,
}: AlertThresholdEditorProps) {
    const [open, setOpen] = useState(false)
    const [threshold, setThreshold] = useState(currentThreshold)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const result = await updateAlertThreshold(productId, threshold)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Seuil d\'alerte mis à jour')
            setOpen(false)
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon-sm">
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
                        <div className="space-y-2">
                            <Label htmlFor="threshold">
                                Seuil d'alerte (unités)
                            </Label>
                            <Input
                                id="threshold"
                                type="number"
                                min="0"
                                max="1000"
                                value={threshold}
                                onChange={(e) =>
                                    setThreshold(parseInt(e.target.value) || 0)
                                }
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                Vous serez alerté quand le stock descend sous ce
                                seuil
                            </p>
                        </div>

                        {threshold !== currentThreshold && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    Seuil actuel : {currentThreshold} → Nouveau
                                    seuil : {threshold}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
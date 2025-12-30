// app/(dashboard)/dashboard/tables/create-table-dialog.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { createTable } from '@/lib/actions/table'

export function CreateTableDialog({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleOpenChange(newOpen: boolean) {
        setOpen(newOpen)
        if (!newOpen) {
            setIsLoading(false)
            setError(null)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const number = parseInt(formData.get('number') as string)

        if (isNaN(number) || number <= 0) {
            setError('Le numéro doit être supérieur à 0')
            setIsLoading(false)
            return
        }

        const result = await createTable(number)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            setIsLoading(false)
            setOpen(false)
            router.refresh()
                ; (e.target as HTMLFormElement).reset()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créer une table</DialogTitle>
                    <DialogDescription>
                        Ajoutez une nouvelle table à votre restaurant
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="number">
                            Numéro de table <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="number"
                            name="number"
                            type="number"
                            min="1"
                            placeholder="Ex: 5"
                            required
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Le numéro qui sera affiché sur le QR code
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Création...
                                </>
                            ) : (
                                'Créer'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
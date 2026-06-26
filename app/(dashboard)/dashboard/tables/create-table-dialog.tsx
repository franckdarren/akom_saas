// app/(dashboard)/dashboard/tables/create-table-dialog.tsx
'use client'

import {useState} from 'react'
import {toast} from "sonner"
import {useRouter} from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'

import {createTable} from '@/lib/actions/table'
import {useActivityLabels} from '@/lib/hooks/use-activity-labels'

export function CreateTableDialog({children}: { children: React.ReactNode }) {
    const labels = useActivityLabels()
    const indefiniteArticle = labels.tableGender === 'f' ? 'une' : 'un'
    const newAdjective = labels.tableGender === 'f' ? 'une nouvelle' : 'un nouveau'
    // Article défini avec élision pour les noms commençant par une voyelle (ex. "espace" → "de l'espace")
    const definiteArticle = /^[aeiouéèêh]/i.test(labels.tableName)
        ? "de l'"
        : labels.tableGender === 'f' ? 'de la ' : 'du '
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
            toast.success("Création enregistrée avec succès.")
            router.refresh()
            ;(e.target as HTMLFormElement).reset()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créer {indefiniteArticle} {labels.tableName}</DialogTitle>
                    <DialogDescription>
                        Ajoutez {newAdjective} {labels.tableName} à votre {labels.structureName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="number">
                            Numéro {definiteArticle}{labels.tableName} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="number"
                            name="number"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
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
                        <div
                            className="bg-destructive-subtle text-destructive p-3 rounded-lg text-sm">
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
                        <LoadingButton type="submit" isLoading={isLoading} loadingText="Création...">
                            Créer
                        </LoadingButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
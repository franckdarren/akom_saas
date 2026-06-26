// app/(dashboard)/dashboard/menu/categories/create-category-dialog.tsx
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
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { createCategory } from '@/lib/actions/category'
import { toast } from "sonner"
import { useActivityLabels } from '@/lib/hooks/use-activity-labels'


export function CreateCategoryDialog({ children }: { children: React.ReactNode }) {
    const labels = useActivityLabels()
    const indefiniteArticle = labels.categoryGender === 'f' ? 'une' : 'un'
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Réinitialiser l'état quand le dialog se ferme
    function handleOpenChange(newOpen: boolean) {
        setOpen(newOpen)
        if (!newOpen) {
            // Dialog fermé → reset tout
            setIsLoading(false)
            setError(null)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
        }

        const result = await createCategory(data)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            toast.error("Une erreur est survenue lors de la création.")
        } else {
            setOpen(false)
            router.refresh()
                // Reset form
                ; (e.target as HTMLFormElement).reset()
            setIsLoading(false)
            toast.success("Création enregistrée avec succès.")

        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créer {indefiniteArticle} {labels.categoryName}</DialogTitle>
                    <DialogDescription>
                        Ajoutez {indefiniteArticle} {labels.categoryName} à votre {labels.catalogName}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder={`Nom ${labels.categoryGender === 'f' ? 'de la' : 'du'} ${labels.categoryName}`}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optionnel)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Une brève description de cette catégorie"
                            disabled={isLoading}
                            rows={3}
                        />
                    </div>

                    {error && (
                        <div className="bg-destructive-subtle text-destructive p-3 rounded-lg text-sm">
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
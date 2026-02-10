// app/(dashboard)/dashboard/menu/categories/[id]/families/edit-family-dialog.tsx
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
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { updateFamily } from '@/lib/actions/family'
import { toast } from 'sonner'

type Family = {
    id: string
    name: string
    description: string | null
}

interface EditFamilyDialogProps {
    family: Family
    categoryName: string
    children: React.ReactNode
}

/**
 * Dialog de modification d'une famille existante
 * 
 * Ce composant utilise le pattern "children" de shadcn/ui :
 * L'élément enfant (généralement un DropdownMenuItem) devient le déclencheur du dialog
 * 
 * Utilisation :
 * <EditFamilyDialog family={family} categoryName="Plats">
 *   <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
 *     <Edit className="mr-2 h-4 w-4" />
 *     Modifier
 *   </DropdownMenuItem>
 * </EditFamilyDialog>
 */
export function EditFamilyDialog({ 
    family,
    categoryName,
    children 
}: EditFamilyDialogProps) {
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
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
        }

        const result = await updateFamily(family.id, data)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            toast.error(result.error)
        } else {
            setOpen(false)
            setIsLoading(false)
            toast.success(`Famille "${data.name}" modifiée avec succès`)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier la famille dans &quot;{categoryName}&quot;</DialogTitle>
                    <DialogDescription>
                        Modifiez les informations de cette famille de produits
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ex: Vins rouges"
                            defaultValue={family.name}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optionnel)</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Une brève description de cette famille de produits"
                            defaultValue={family.description || ''}
                            disabled={isLoading}
                            rows={3}
                        />
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
                                    Enregistrement...
                                </>
                            ) : (
                                'Enregistrer'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
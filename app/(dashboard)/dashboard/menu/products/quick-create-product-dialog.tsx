// app/(dashboard)/dashboard/menu/products/quick-create-product-dialog.tsx
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createProduct } from '@/lib/actions/product'
import { toast } from "sonner"


type Category = {
    id: string
    name: string
}

export function QuickCreateProductDialog({
    categories,
    children,
}: {
    categories: Category[]
    children: React.ReactNode
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>('')

    // Réinitialiser l'état quand le dialog se ferme
    function handleOpenChange(newOpen: boolean) {
        setOpen(newOpen)
        if (!newOpen) {
            setIsLoading(false)
            setError(null)
            setSelectedCategory('')
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            price: parseInt(formData.get('price') as string),
            categoryId: selectedCategory || undefined,
        }

        const result = await createProduct(data)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            toast.error("Une erreur est survenue lors de la création du produit.")
        } else {
            setOpen(false)
            router.refresh()
                // Reset form
                ; (e.target as HTMLFormElement).reset()
            setSelectedCategory('')
            setIsLoading(false)
            toast.success("Le produit a été créé avec succès.")

        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Création rapide de produit</DialogTitle>
                    <DialogDescription>
                        Créez rapidement un produit avec les informations essentielles.
                        Vous pourrez ajouter la description et l'image plus tard.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom du produit <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ex: Poulet Curry"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">
                            Prix (FCFA) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="3500"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Catégorie</Label>
                        <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Aucune catégorie</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
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
import { toast } from 'sonner'

type Category = {
    id: string
    name: string
}

type ProductType = 'good' | 'service'

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
    const [selectedType, setSelectedType] = useState<ProductType>('good')
    const [includePrice, setIncludePrice] = useState(true)

    function handleOpenChange(newOpen: boolean) {
        setOpen(newOpen)
        if (!newOpen) {
            setIsLoading(false)
            setError(null)
            setSelectedCategory('')
            setSelectedType('good')
            setIncludePrice(true)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const price = parseInt(formData.get('price') as string)

        const data = {
            name,
            price,
            categoryId: selectedCategory || undefined,
            productType: selectedType,
            includePrice,
        }

        const result = await createProduct(data)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            toast.error("Une erreur est survenue lors de la création du produit.")
        } else {
            setOpen(false)
            router.refresh()
            ;(e.target as HTMLFormElement).reset()
            setSelectedCategory('')
            setSelectedType('good')
            setIncludePrice(true)
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
                    {/* Nom du produit */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom du produit <span className="text-red-500">*</span>
                        </Label>
                        <Input id="name" name="name" placeholder="Ex: Poulet Curry" required disabled={isLoading} />
                    </div>

                    {/* Prix */}
                    <div className="space-y-2">
                        <Label htmlFor="price">
                            Prix (FCFA) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="25"
                            placeholder="3500"
                            required
                            disabled={isLoading || !includePrice}
                        />
                    </div>

                    {/* Inclure le prix */}
                    <div className="space-y-2 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="includePrice"
                            checked={includePrice}
                            disabled={isLoading}
                            onChange={(e) => setIncludePrice(e.target.checked)}
                        />
                        <Label htmlFor="includePrice">Inclure le prix</Label>
                    </div>

                    {/* Type de produit */}
                    <div className="space-y-2">
                        <Label htmlFor="productType">Type de produit</Label>
                        <Select
                            value={selectedType}
                            onValueChange={(val) => setSelectedType(val as ProductType)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="good">Bien (stockable)</SelectItem>
                                <SelectItem value="service">Service (sans stock)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Catégorie */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Catégorie</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isLoading}>
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

                    {/* Erreur */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Boutons */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
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

// app/(dashboard)/dashboard/menu/products/product-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createProduct, updateProduct } from '@/lib/actions/product'
import { ImageUploader } from '@/components/image-uploader'

type Category = {
    id: string
    name: string
}

type Product = {
    id: string
    name: string
    description: string | null
    price: number
    categoryId: string | null
    imageUrl: string | null
}

interface ProductFormProps {
    categories: Category[]
    product?: Product
}

export function ProductForm({ categories, product }: ProductFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>(
        product?.categoryId || ''
    )
    const [imageUrl, setImageUrl] = useState<string | null>(
        product?.imageUrl || null
    )

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: parseInt(formData.get('price') as string),
            categoryId: selectedCategory || undefined,
            imageUrl: imageUrl || undefined, // ← Utilise l'URL de l'image uploadée
        }

        const result = product
            ? await updateProduct(product.id, data)
            : await createProduct(data)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            router.push('/dashboard/menu/products')
            router.refresh()
            setIsLoading(false)

        }
    }

    return (
        <Card>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom du produit <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ex: Poulet Curry"
                            defaultValue={product?.name}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Décrivez votre produit..."
                            defaultValue={product?.description || ''}
                            disabled={isLoading}
                            rows={3}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
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
                                defaultValue={product?.price}
                                required
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Prix en FCFA (nombre entier uniquement)
                            </p>
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
                    </div>

                    <div className="space-y-2">
                        <ImageUploader
                            value={imageUrl}
                            onUploadComplete={(url) => setImageUrl(url)}
                            onRemove={() => setImageUrl(null)}
                            disabled={isLoading}
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
                            onClick={() => router.push('/dashboard/menu/products')}
                            disabled={isLoading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {product ? 'Enregistrement...' : 'Création...'}
                                </>
                            ) : product ? (
                                'Enregistrer'
                            ) : (
                                'Créer le produit'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
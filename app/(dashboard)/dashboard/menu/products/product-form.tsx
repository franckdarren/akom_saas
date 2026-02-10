// app/(dashboard)/dashboard/menu/products/product-form.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Loader2, Info } from 'lucide-react'
import { createProduct, updateProduct } from '@/lib/actions/product'
import { ImageUploader } from '@/components/image-uploader'
import { toast } from "sonner"

// ============================================================
// TYPES
// ============================================================

type Category = {
    id: string
    name: string
}

type Family = {
    id: string
    name: string
    categoryId: string | null // Important pour le filtrage
    position: number
    isActive: boolean
}

type Product = {
    id: string
    name: string
    description: string | null
    price: number
    categoryId: string | null
    familyId: string | null // ← AJOUT : lien vers la famille
    imageUrl: string | null
}

interface ProductFormProps {
    categories: Category[]
    families: Family[] // ← AJOUT : toutes les familles du restaurant
    product?: Product // Le produit peut maintenant avoir un familyId
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function ProductForm({ categories, families, product }: ProductFormProps) {
    const router = useRouter()
    
    // États de base
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl || null)
    
    // États pour catégorie et famille
    const [selectedCategory, setSelectedCategory] = useState<string>(
        product?.categoryId || ''
    )
    const [selectedFamily, setSelectedFamily] = useState<string>(
        product?.familyId || ''
    )

    // ============================================================
    // FILTRAGE DYNAMIQUE DES FAMILLES
    // ============================================================
    
    /**
     * Filtre les familles en fonction de la catégorie sélectionnée.
     * Utilise useMemo pour éviter de recalculer à chaque render.
     * 
     * Logique :
     * - Si aucune catégorie n'est sélectionnée → aucune famille disponible
     * - Si catégorie "none" → aucune famille disponible
     * - Sinon → familles appartenant à cette catégorie uniquement
     */
    const availableFamilies = useMemo(() => {
        // Pas de catégorie = pas de familles
        if (!selectedCategory || selectedCategory === 'none') {
            return []
        }

        // Filtrer les familles qui appartiennent à cette catégorie
        return families.filter(family => family.categoryId === selectedCategory)
    }, [selectedCategory, families])

    // ============================================================
    // EFFET : RÉINITIALISER LA FAMILLE SI LA CATÉGORIE CHANGE
    // ============================================================
    
    /**
     * Quand l'utilisateur change de catégorie, on vérifie si la famille
     * sélectionnée appartient toujours à la nouvelle catégorie.
     * Si ce n'est pas le cas, on réinitialise la sélection de famille.
     * 
     * Cela évite d'avoir une famille invalide (ex: famille "Grillades"
     * alors que la catégorie est "Boissons")
     */
    useEffect(() => {
        if (!selectedFamily) return // Pas de famille sélectionnée, rien à faire

        // Vérifier si la famille actuelle est dans la liste des familles disponibles
        const isFamilyStillValid = availableFamilies.some(
            family => family.id === selectedFamily
        )

        // Si la famille n'est plus valide, on la réinitialise
        if (!isFamilyStillValid) {
            setSelectedFamily('')
        }
    }, [selectedCategory, selectedFamily, availableFamilies])

    // ============================================================
    // GESTIONNAIRE DE CHANGEMENT DE CATÉGORIE
    // ============================================================
    
    /**
     * Quand l'utilisateur change de catégorie, on met à jour l'état.
     * L'useEffect ci-dessus se chargera de réinitialiser la famille si nécessaire.
     */
    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value)
        // Note : on ne réinitialise pas selectedFamily ici,
        // l'useEffect s'en charge automatiquement
    }

    // ============================================================
    // SOUMISSION DU FORMULAIRE
    // ============================================================
    
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        
        // Préparation des données à envoyer
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: parseInt(formData.get('price') as string),
            categoryId: selectedCategory && selectedCategory !== 'none' 
                ? selectedCategory 
                : undefined,
            familyId: selectedFamily || undefined, // ← AJOUT : envoi du familyId
            imageUrl: imageUrl || undefined,
        }

        // Appel de l'action serveur (create ou update)
        const result = product
            ? await updateProduct(product.id, data)
            : await createProduct(data)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            toast.error("Une erreur est survenue lors de l'enregistrement du produit.")
        } else {
            router.push('/dashboard/menu/products')
            router.refresh()
            setIsLoading(false)
            toast.success(product 
                ? "Le produit a été modifié avec succès." 
                : "Le produit a été ajouté avec succès."
            )
        }
    }

    // ============================================================
    // RENDU DU FORMULAIRE
    // ============================================================
    
    return (
        <Card>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* ========== NOM DU PRODUIT ========== */}
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

                    {/* ========== DESCRIPTION ========== */}
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

                    {/* ========== PRIX ========== */}
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
                                step="25"
                                placeholder="3500"
                                defaultValue={product?.price}
                                required
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Prix en FCFA (nombre entier uniquement)
                            </p>
                        </div>

                        {/* ========== CATÉGORIE ========== */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Catégorie</Label>
                            <Select
                                value={selectedCategory}
                                onValueChange={handleCategoryChange}
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

                    {/* ========== FAMILLE (conditionnel) ========== */}
                    {selectedCategory && selectedCategory !== 'none' && (
                        <div className="space-y-2">
                            <Label htmlFor="family">
                                Famille (optionnel)
                            </Label>
                            <Select
                                value={selectedFamily}
                                onValueChange={setSelectedFamily}
                                disabled={isLoading || availableFamilies.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={
                                        availableFamilies.length === 0
                                            ? "Aucune famille disponible"
                                            : "Sélectionner une famille"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucune famille</SelectItem>
                                    {availableFamilies.map((family) => (
                                        <SelectItem key={family.id} value={family.id}>
                                            {family.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {/* Message d'aide si aucune famille n'existe */}
                            {availableFamilies.length === 0 && (
                                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <p>
                                        Aucune famille n'existe pour cette catégorie. 
                                        Vous pouvez créer des familles depuis la page des catégories 
                                        pour mieux organiser vos produits.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== IMAGE ========== */}
                    <div className="space-y-2">
                        <ImageUploader
                            value={imageUrl}
                            onUploadComplete={(url) => setImageUrl(url)}
                            onRemove={() => setImageUrl(null)}
                            disabled={isLoading}
                        />
                    </div>

                    {/* ========== MESSAGE D'ERREUR ========== */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* ========== BOUTONS D'ACTION ========== */}
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
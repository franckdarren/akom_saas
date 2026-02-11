// app/(dashboard)/dashboard/menu/products/product-form.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Info, Package, Wrench } from 'lucide-react'
import { createProduct, updateProduct } from '@/lib/actions/product'
import { ImageUploader } from '@/components/image-uploader'
import { toast } from "sonner"
import type { ProductType } from '@/types/product'

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
    categoryId: string | null
    position: number
    isActive: boolean
}

type Product = {
    id: string
    name: string
    description: string | null
    price: number | null // ← Maintenant nullable pour "sur devis"
    categoryId: string | null
    familyId: string | null
    imageUrl: string | null
    productType: ProductType // ← NOUVEAU
    includePrice: boolean // ← NOUVEAU
    hasStock: boolean // ← NOUVEAU
}

interface ProductFormProps {
    categories: Category[]
    families: Family[]
    product?: Product
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
    
    // ============================================================
    // NOUVEAUX ÉTATS : Type de produit et options
    // ============================================================
    
    const [productType, setProductType] = useState<ProductType>(
        product?.productType || 'good'
    )
    const [includePrice, setIncludePrice] = useState<boolean>(
        product?.includePrice ?? true
    )
    
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
    
    const availableFamilies = useMemo(() => {
        if (!selectedCategory || selectedCategory === 'none') {
            return []
        }
        return families.filter(family => family.categoryId === selectedCategory)
    }, [selectedCategory, families])

    // ============================================================
    // EFFET : RÉINITIALISER LA FAMILLE SI LA CATÉGORIE CHANGE
    // ============================================================
    
    useEffect(() => {
        if (!selectedFamily) return

        const isFamilyStillValid = availableFamilies.some(
            family => family.id === selectedFamily
        )

        if (!isFamilyStillValid) {
            setSelectedFamily('')
        }
    }, [selectedCategory, selectedFamily, availableFamilies])

    // ============================================================
    // EFFET : RÉINITIALISER includePrice SI ON PASSE À "BIEN"
    // ============================================================
    
    useEffect(() => {
        // Les biens ont toujours un prix affiché
        if (productType === 'good') {
            setIncludePrice(true)
        }
    }, [productType])

    // ============================================================
    // GESTIONNAIRE DE CHANGEMENT DE CATÉGORIE
    // ============================================================
    
    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value)
    }

    // ============================================================
    // SOUMISSION DU FORMULAIRE
    // ============================================================
    
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        
        // Récupération du prix
        const priceValue = formData.get('price') as string
        const price = priceValue ? parseInt(priceValue) : null

        // ✅ VALIDATION : Les biens doivent avoir un prix
        if (productType === 'good' && !price) {
            setError('Le prix est obligatoire pour les biens')
            setIsLoading(false)
            toast.error('Le prix est obligatoire pour les biens')
            return
        }

        // ✅ VALIDATION : Les services avec prix affiché doivent avoir un prix
        if (productType === 'service' && includePrice && !price) {
            setError('Veuillez saisir un prix ou désactiver "Afficher un prix"')
            setIsLoading(false)
            toast.error('Veuillez saisir un prix ou désactiver "Afficher un prix"')
            return
        }
        
        // Préparation des données à envoyer
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: price,
            categoryId: selectedCategory && selectedCategory !== 'none' 
                ? selectedCategory 
                : undefined,
            familyId: selectedFamily || undefined,
            imageUrl: imageUrl || undefined,
            productType: productType, // ← NOUVEAU
            includePrice: includePrice, // ← NOUVEAU
            hasStock: productType === 'good', // ← NOUVEAU : auto-calculé
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
                    
                    {/* ========== SECTION 1 : TYPE DE PRODUIT ========== */}
                    <div className="space-y-4">
                        <div>
                            <Label className="text-base font-semibold">
                                Type de produit <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Choisissez si c'est un bien physique ou une prestation de service
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Bouton Bien */}
                            <button
                                type="button"
                                onClick={() => setProductType('good')}
                                disabled={isLoading}
                                className={`
                                    relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all
                                    ${productType === 'good' 
                                        ? 'border-primary bg-primary/5 shadow-sm' 
                                        : 'border-muted hover:border-muted-foreground/50'
                                    }
                                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <Package className={`h-8 w-8 ${productType === 'good' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div className="text-center">
                                    <div className="font-semibold">Bien</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Article physique avec stock
                                    </div>
                                </div>
                                {productType === 'good' && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                                )}
                            </button>

                            {/* Bouton Service */}
                            <button
                                type="button"
                                onClick={() => setProductType('service')}
                                disabled={isLoading}
                                className={`
                                    relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all
                                    ${productType === 'service' 
                                        ? 'border-primary bg-primary/5 shadow-sm' 
                                        : 'border-muted hover:border-muted-foreground/50'
                                    }
                                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <Wrench className={`h-8 w-8 ${productType === 'service' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div className="text-center">
                                    <div className="font-semibold">Service</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Prestation sans stock
                                    </div>
                                </div>
                                {productType === 'service' && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                                )}
                            </button>
                        </div>

                        {/* Message d'information selon le type */}
                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <p>
                                {productType === 'good' ? (
                                    <>
                                        <strong>Bien :</strong> Un stock sera automatiquement créé. 
                                        Le produit sera disponible dès qu'il y aura du stock.
                                    </>
                                ) : (
                                    <>
                                        <strong>Service :</strong> Aucun stock ne sera géré. 
                                        Le service est toujours disponible sauf si vous le désactivez manuellement.
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* ========== SECTION 2 : INFORMATIONS DE BASE ========== */}
                    <div className="space-y-4">
                        {/* Nom */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Nom du {productType === 'good' ? 'produit' : 'service'} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder={productType === 'good' ? 'Ex: Poulet Curry' : 'Ex: Livraison à domicile'}
                                defaultValue={product?.name}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Description */}
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

                        {/* Catégorie et Famille */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Catégorie */}
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

                            {/* Famille (conditionnel) */}
                            {selectedCategory && selectedCategory !== 'none' && (
                                <div className="space-y-2">
                                    <Label htmlFor="family">Famille (optionnel)</Label>
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
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ========== SECTION 3 : TARIFICATION ========== */}
                    <div className="space-y-4">
                        <div>
                            <Label className="text-base font-semibold">Tarification</Label>
                        </div>

                        {/* Toggle "Afficher un prix" (uniquement pour les services) */}
                        {productType === 'service' && (
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="includePrice" className="cursor-pointer">
                                        Afficher un prix
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Si désactivé, "Sur devis" sera affiché à la place du prix
                                    </p>
                                </div>
                                <Switch
                                    id="includePrice"
                                    checked={includePrice}
                                    onCheckedChange={setIncludePrice}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {/* Champ prix (conditionnel) */}
                        {(productType === 'good' || includePrice) && (
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
                                    defaultValue={product?.price || undefined}
                                    required={productType === 'good' || includePrice}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {productType === 'good' 
                                        ? 'Prix en FCFA (nombre entier uniquement)'
                                        : 'Prix de départ en FCFA (nombre entier uniquement)'
                                    }
                                </p>
                            </div>
                        )}

                        {/* Message "Sur devis" */}
                        {productType === 'service' && !includePrice && (
                            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <p>
                                    Le texte <strong>"Sur devis"</strong> sera affiché à la place du prix. 
                                    Les clients pourront demander un devis personnalisé.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ========== SECTION 4 : IMAGE ========== */}
                    <div className="space-y-2">
                        <Label>Image (optionnel)</Label>
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
// app/(dashboard)/dashboard/menu/products/product-form.tsx
'use client'

import {useState, useEffect, useMemo} from 'react'
import {useRouter} from 'next/navigation'
import {AppCard, CardContent} from '@/components/ui/app-card'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Switch} from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {Info, Package, Wrench} from 'lucide-react'
import {createProduct, updateProduct} from '@/lib/actions/product'
import {ImageUploader} from '@/components/image-uploader'
import {toast} from "sonner"
import type {ProductType} from '@/types/product'
import type {ActivityLabels} from '@/lib/config/activity-labels' // ← NOUVEAU

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
    price: number | null
    categoryId: string | null
    familyId: string | null
    imageUrl: string | null
    productType: ProductType
    includePrice: boolean
    hasStock: boolean
}

interface ProductFormProps {
    categories: Category[]
    families: Family[]
    product?: Product
    labels?: ActivityLabels // ← NOUVEAU (optionnel pour ne pas casser new/page.tsx)
}

export function ProductForm({categories, families, product, labels}: ProductFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl || null)

    const [productType, setProductType] = useState<ProductType>(
        product?.productType || 'good'
    )
    const [includePrice, setIncludePrice] = useState<boolean>(
        product?.includePrice ?? true
    )
    const [selectedCategory, setSelectedCategory] = useState<string>(
        product?.categoryId || ''
    )
    const [selectedFamily, setSelectedFamily] = useState<string>(
        product?.familyId || ''
    )

    // ← Nom générique du produit selon le type d'activité (fallback sur "produit")
    const productLabel = labels?.productName ?? 'produit'
    const categoryLabel = labels?.categoryName ?? 'catégorie'

    const availableFamilies = useMemo(() => {
        if (!selectedCategory || selectedCategory === 'none') return []
        return families.filter(family => family.categoryId === selectedCategory)
    }, [selectedCategory, families])

    useEffect(() => {
        if (!selectedFamily) return
        const isFamilyStillValid = availableFamilies.some(f => f.id === selectedFamily)
        if (!isFamilyStillValid) setSelectedFamily('')
    }, [selectedCategory, selectedFamily, availableFamilies])

    useEffect(() => {
        if (productType === 'good') setIncludePrice(true)
    }, [productType])

    const handleCategoryChange = (value: string) => setSelectedCategory(value)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const priceValue = formData.get('price') as string
        const price = priceValue ? parseInt(priceValue) : null

        if (productType === 'good' && !price) {
            setError(`Le prix est obligatoire pour les ${productLabel}s`)
            setIsLoading(false)
            toast.error(`Le prix est obligatoire pour les ${productLabel}s`)
            return
        }

        if (productType === 'service' && includePrice && !price) {
            setError('Veuillez saisir un prix ou désactiver "Afficher un prix"')
            setIsLoading(false)
            toast.error('Veuillez saisir un prix ou désactiver "Afficher un prix"')
            return
        }

        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price,
            categoryId: selectedCategory && selectedCategory !== 'none'
                ? selectedCategory
                : undefined,
            familyId: selectedFamily || undefined,
            imageUrl: imageUrl || undefined,
            productType,
            includePrice,
            hasStock: productType === 'good',
        }

        const result = product
            ? await updateProduct(product.id, data)
            : await createProduct(data)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            toast.error("Une erreur est survenue lors de l'enregistrement.")
        } else {
            router.push('/dashboard/menu/products')
            router.refresh()
            setIsLoading(false)
            toast.success(product
                ? `Le ${productLabel} a été modifié avec succès.`
                : `Le ${productLabel} a été ajouté avec succès.`
            )
        }
    }

    return (
        <AppCard variant="flat">
            <CardContent className="layout-form">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ========== TYPE ========== */}
                    <div className="space-y-4">
                        <div>
                            <Label className="text-base font-semibold">
                                Type <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Choisissez si c&apos;est un bien physique ou une prestation de service
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setProductType('good')}
                                disabled={isLoading}
                                className={`
                                    relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all
                                    ${productType === 'good'
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-muted hover:border-muted-foreground/50'}
                                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <Package
                                    className={`h-8 w-8 ${productType === 'good' ? 'text-primary' : 'text-muted-foreground'}`}/>
                                <div className="text-center">
                                    <div className="font-semibold">Bien</div>
                                    <div className="text-xs text-muted-foreground mt-1">Article physique avec stock
                                    </div>
                                </div>
                                {productType === 'good' && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"/>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setProductType('service')}
                                disabled={isLoading}
                                className={`
                                    relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all
                                    ${productType === 'service'
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-muted hover:border-muted-foreground/50'}
                                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <Wrench
                                    className={`h-8 w-8 ${productType === 'service' ? 'text-primary' : 'text-muted-foreground'}`}/>
                                <div className="text-center">
                                    <div className="font-semibold">Service</div>
                                    <div className="text-xs text-muted-foreground mt-1">Prestation sans stock</div>
                                </div>
                                {productType === 'service' && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"/>
                                )}
                            </button>
                        </div>

                        <div
                            className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0"/>
                            <p>
                                {productType === 'good' ? (
                                    <><strong>Bien :</strong> Un stock sera automatiquement créé.</>
                                ) : (
                                    <><strong>Service :</strong> Aucun stock ne sera géré.</>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* ========== INFORMATIONS DE BASE ========== */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                {/* ← Label dynamique */}
                                Nom du {productType === 'good' ? productLabel : 'service'}{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder={productType === 'good'
                                    ? `Ex: ${labels?.productNameCapital ?? 'Produit'} 1`
                                    : 'Ex: Livraison à domicile'}
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
                                placeholder={`Décrivez votre ${productLabel}...`}
                                defaultValue={product?.description || ''}
                                disabled={isLoading}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                {/* ← Label dynamique */}
                                <Label htmlFor="category">{labels?.categoryNameCapital ?? 'Catégorie'}</Label>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={handleCategoryChange}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={`Sélectionner une ${categoryLabel}`}/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Aucune {categoryLabel}</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

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
                                            }/>
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

                    {/* ========== TARIFICATION ========== */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Tarification</Label>

                        {productType === 'service' && (
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="includePrice" className="cursor-pointer">
                                        Afficher un prix
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Si désactivé, &quot;Sur devis&quot; sera affiché
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

                        {(productType === 'good' || includePrice) && (
                            <div className="space-y-2">
                                <Label htmlFor="price">
                                    Prix (FCFA) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
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
                                        : 'Prix de départ en FCFA (nombre entier uniquement)'}
                                </p>
                            </div>
                        )}

                        {productType === 'service' && !includePrice && (
                            <div
                                className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0"/>
                                <p>
                                    Le texte <strong>&quot;Sur devis&quot;</strong> sera affiché à la place du prix.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ========== IMAGE ========== */}
                    <div className="space-y-2">
                        <Label>Image (optionnel)</Label>
                        <ImageUploader
                            value={imageUrl}
                            onUploadComplete={(url) => setImageUrl(url)}
                            onRemove={() => setImageUrl(null)}
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
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
                        <LoadingButton
                            type="submit"
                            isLoading={isLoading}
                            loadingText={product ? 'Enregistrement...' : 'Création...'}
                        >
                            {product ? 'Enregistrer' : `Créer le ${productLabel}`}
                        </LoadingButton>
                    </div>
                </form>
            </CardContent>
        </AppCard>
    )
}
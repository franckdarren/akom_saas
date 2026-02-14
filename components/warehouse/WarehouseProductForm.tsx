'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { storageUnits } from '@/lib/validations/warehouse'
import { createWarehouseProduct, updateWarehouseProduct } from '@/lib/actions/warehouse'
import { WarehouseProduct } from '@/types/warehouse'


interface WarehouseProductFormProps {
    initialData?: WarehouseProduct
    availableProducts?: Array<{ id: string; name: string; imageUrl: string | null }>
}

/**
 * Formulaire complet de création et d'édition de produit d'entrepôt.
 *
 * Ce formulaire est conçu pour guider l'utilisateur à travers toutes les étapes
 * nécessaires pour configurer correctement un produit dans son magasin de stockage.
 * Il utilise Sonner pour afficher des notifications claires et non intrusives
 * qui informent l'utilisateur du résultat de ses actions.
 *
 * Le formulaire s'adapte automatiquement selon le contexte :
 * - En mode création, il affiche la section de stock initial
 * - En mode édition, il pré-remplit tous les champs avec les données existantes
 *
 * L'organisation en sections distinctes aide l'utilisateur à comprendre
 * qu'il remplit différentes parties conceptuelles de la configuration du produit.
 */
export function WarehouseProductForm({
                                         initialData,
                                         availableProducts = []
                                     }: WarehouseProductFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // Déterminer si nous sommes en mode édition
    // Cela change le comportement de plusieurs parties du formulaire
    const isEditing = !!initialData

    // État pour l'aperçu de l'image avant upload
    // Nous stockons soit l'URL existante (en mode édition) soit la nouvelle image en base64
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null)

    // État principal qui contient toutes les valeurs du formulaire
    // Regrouper tous les champs dans un seul objet facilite la gestion de l'état
    // et rend le code plus maintenable quand on a beaucoup de champs
    const [formData, setFormData] = useState({
        // Section 1 : Informations de base
        name: initialData?.name || '',
        sku: initialData?.sku || '',
        description: initialData?.description || '',
        category: initialData?.category || '',
        imageUrl: initialData?.imageUrl || '',

        // Section 2 : Configuration de l'emballage
        storageUnit: initialData?.storageUnit || 'carton',
        unitsPerStorage: initialData?.unitsPerStorage || 1,

        // Section 3 : Lien avec le menu
        linkedProductId: initialData?.linkedProductId || '',
        conversionRatio: Number(initialData?.conversionRatio) || 1,

        // Section 4 : Stock initial (uniquement pour création)
        initialQuantity: 0,
        unitCost: 0,
        alertThreshold: 10,

        // Notes additionnelles
        notes: initialData?.notes || '',
    })

    /**
     * Fonction utilitaire pour mettre à jour un champ spécifique du formulaire.
     *
     * Cette approche avec une fonction générique évite de créer une fonction
     * de changement distincte pour chaque champ. Le spread operator (...prev)
     * crée une copie de l'état actuel et remplace uniquement le champ modifié,
     * ce qui est la méthode recommandée pour mettre à jour l'état en React.
     */
    function handleChange(field: string, value: any) {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    /**
     * Gère l'upload et l'aperçu d'une image.
     *
     * Cette version utilise FileReader pour convertir l'image en base64,
     * ce qui permet un aperçu immédiat sans avoir à uploader vers un serveur.
     *
     * IMPORTANT POUR LA PRODUCTION :
     * Cette approche base64 est acceptable pour un MVP car elle est simple à implémenter,
     * mais en production vous devriez uploader l'image vers Supabase Storage.
     *
     * Le processus complet d'upload vers Supabase serait :
     *
     * 1. Créer un bucket dans Supabase Storage appelé 'warehouse-products'
     * 2. Configurer les permissions RLS pour que seuls les utilisateurs authentifiés
     *    du restaurant puissent uploader et supprimer des images
     * 3. Dans cette fonction, au lieu de FileReader, utiliser :
     *    const { data, error } = await supabase.storage
     *      .from('warehouse-products')
     *      .upload(`${restaurantId}/${productId}/${file.name}`, file)
     * 4. Récupérer l'URL publique avec getPublicUrl()
     * 5. Stocker cette URL dans formData.imageUrl
     *
     * L'avantage de Supabase Storage est que vos images sont hébergées sur un CDN
     * rapide, optimisées automatiquement, et votre base de données reste légère.
     */
    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Vérifier la taille du fichier pour éviter des uploads trop lourds
        // 5MB est une limite raisonnable pour des photos de produits
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image trop volumineuse', {
                description: 'Veuillez choisir une image de moins de 5 MB',
            })
            return
        }

        // Vérifier que c'est bien un fichier image
        // Le type MIME commence par 'image/' pour tous les formats d'image
        if (!file.type.startsWith('image/')) {
            toast.error('Format invalide', {
                description: 'Veuillez choisir un fichier image (JPG, PNG, WebP, etc.)',
            })
            return
        }

        // Convertir l'image en base64 pour l'aperçu
        // FileReader est une API navigateur qui lit le contenu des fichiers
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            setImagePreview(base64String)
            handleChange('imageUrl', base64String)
        }
        reader.readAsDataURL(file)
    }

    /**
     * Gère la soumission du formulaire avec validation et feedback utilisateur.
     *
     * Cette fonction est le cœur de la logique du formulaire. Elle coordonne
     * plusieurs étapes importantes : validation des données, communication avec
     * le serveur, gestion des erreurs, et feedback utilisateur via les toasts Sonner.
     *
     * Le pattern try-catch-finally garantit que l'état de chargement est toujours
     * désactivé à la fin, même si une erreur se produit. Cela évite que l'interface
     * reste bloquée en cas de problème.
     */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // ============================================================
        // VALIDATIONS CÔTÉ CLIENT
        // ============================================================

        if (!formData.name.trim()) {
            toast.error('Nom requis', {
                description: 'Le nom du produit est obligatoire',
            })
            return
        }

        if (formData.unitsPerStorage < 1) {
            toast.error('Valeur invalide', {
                description: 'Le nombre d\'unités par emballage doit être au moins 1',
            })
            return
        }

        // Si un produit menu est lié, le ratio de conversion doit être valide
        // IMPORTANT : On vérifie que linkedProductId n'est pas "none" car c'est notre valeur sentinelle
        if (formData.linkedProductId && formData.linkedProductId !== 'none' && formData.conversionRatio <= 0) {
            toast.error('Ratio invalide', {
                description: 'Le ratio de conversion doit être supérieur à 0',
            })
            return
        }

        setIsLoading(true)

        try {
            // ============================================================
            // NETTOYAGE DES DONNÉES AVANT ENVOI
            // Cette étape est cruciale : on convertit "none" en undefined
            // ============================================================

            // Fonction helper qui nettoie les valeurs "none" et les chaînes vides
            const cleanOptionalString = (value: string | undefined) => {
                if (!value || value === '' || value === 'none') {
                    return undefined
                }
                return value
            }

            // Préparer les données en nettoyant les valeurs sentinelles
            const cleanedData = {
                name: formData.name,
                sku: cleanOptionalString(formData.sku),
                description: cleanOptionalString(formData.description),
                category: cleanOptionalString(formData.category),
                imageUrl: cleanOptionalString(formData.imageUrl),
                storageUnit: formData.storageUnit,
                unitsPerStorage: formData.unitsPerStorage,
                // CRITIQUE : Convertir "none" en undefined pour linkedProductId
                linkedProductId: cleanOptionalString(formData.linkedProductId),
                conversionRatio: formData.conversionRatio,
                notes: cleanOptionalString(formData.notes),
            }

            // ============================================================
            // APPEL À LA SERVER ACTION AVEC LES DONNÉES NETTOYÉES
            // ============================================================

            const result = isEditing
                ? await updateWarehouseProduct({
                    id: initialData.id,
                    ...cleanedData,
                })
                : await createWarehouseProduct({
                    ...cleanedData,
                    initialQuantity: formData.initialQuantity,
                    unitCost: formData.unitCost || undefined,
                    alertThreshold: formData.alertThreshold,
                })

            // ============================================================
            // GESTION DU RÉSULTAT AVEC SONNER
            // ============================================================

            if (result.success) {
                toast.success(
                    isEditing ? 'Produit modifié avec succès' : 'Produit créé avec succès',
                    {
                        description: `${formData.name} a été enregistré dans votre entrepôt`,
                    }
                )

                router.push('/dashboard/warehouse')
                router.refresh()
            } else {
                toast.error('Erreur lors de l\'enregistrement', {
                    description: result.error || 'Une erreur inattendue est survenue',
                })
            }
        } catch (error) {
            console.error('Erreur dans le formulaire:', error)
            toast.error('Erreur inattendue', {
                description: 'Impossible de communiquer avec le serveur. Vérifiez votre connexion.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Trouver le produit menu sélectionné pour afficher l'aperçu de conversion
    // Ce produit est utilisé dans la section 3 pour montrer en temps réel
    // ce que signifie la configuration de conversion choisie
    const selectedProduct = availableProducts.find(p => p.id === formData.linkedProductId)

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ============================================================
          SECTION 1 : INFORMATIONS DE BASE
          Cette section capture toutes les informations d'identification du produit
          ============================================================ */}
            <Card>
                <CardHeader>
                    <CardTitle>Informations de base</CardTitle>
                    <CardDescription>
                        Nom, description et image du produit d'entrepôt
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Nom du produit - OBLIGATOIRE */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom du produit <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="Ex: Casier Heineken 33cl"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Donnez un nom clair et descriptif qui vous permettra de reconnaître facilement ce produit
                        </p>
                    </div>

                    {/* SKU et catégorie sur la même ligne pour optimiser l'espace */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="sku">Code SKU (optionnel)</Label>
                            <Input
                                id="sku"
                                placeholder="Ex: BH-33-24"
                                value={formData.sku}
                                onChange={(e) => handleChange('sku', e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Code article pour identification unique
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Catégorie</Label>
                            <Input
                                id="category"
                                placeholder="Ex: Boissons, Alcools, Épicerie..."
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Pour organiser vos produits par type
                            </p>
                        </div>
                    </div>

                    {/* Description - Textarea pour permettre plusieurs lignes */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Informations complémentaires sur le produit..."
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Notez les conditions de stockage, les précautions particulières, etc.
                        </p>
                    </div>

                    {/* Gestion de l'image avec aperçu et possibilité de suppression */}
                    <div className="space-y-2">
                        <Label>Image du produit</Label>
                        {imagePreview ? (
                            <div className="relative w-32 h-32 rounded-lg border overflow-hidden">
                                <Image
                                    src={imagePreview}
                                    alt="Aperçu du produit"
                                    fill
                                    className="object-contain"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        setImagePreview(null)
                                        handleChange('imageUrl', '')
                                    }}
                                    disabled={isLoading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={isLoading}
                                />
                                <Label
                                    htmlFor="image"
                                    className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                                >
                                    <Upload className="h-4 w-4" />
                                    Choisir une image
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG ou WebP, maximum 5 MB
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================
          SECTION 2 : CONFIGURATION DE L'UNITÉ DE STOCKAGE
          Cette section définit comment le produit est emballé dans l'entrepôt
          ============================================================ */}
            <Card>
                <CardHeader>
                    <CardTitle>Unité de stockage</CardTitle>
                    <CardDescription>
                        Comment ce produit est-il emballé dans votre entrepôt ?
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Type d'emballage avec dropdown pour garantir la cohérence */}
                        <div className="space-y-2">
                            <Label htmlFor="storageUnit">
                                Type d&#39;emballage <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.storageUnit}
                                onValueChange={(value) => handleChange('storageUnit', value)}
                                disabled={isLoading}
                            >
                                <SelectTrigger id="storageUnit">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {storageUnits.map((unit) => (
                                        <SelectItem key={unit} value={unit}>
                                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Sélectionnez le type d&#39;emballage utilisé dans votre entrepôt
                            </p>
                        </div>

                        {/* Nombre d'unités par emballage */}
                        <div className="space-y-2">
                            <Label htmlFor="unitsPerStorage">
                                Unités par emballage <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="unitsPerStorage"
                                type="number"
                                min={1}
                                placeholder="Ex: 24"
                                value={formData.unitsPerStorage}
                                onChange={(e) => handleChange('unitsPerStorage', parseInt(e.target.value) || 1)}
                                required
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Combien d&#39;unités individuelles contient un emballage
                            </p>
                        </div>
                    </div>

                    {/* Exemple explicatif pour aider l'utilisateur à comprendre */}
                    <div className="rounded-lg border p-3 bg-muted/50">
                        <p className="text-sm text-muted-foreground">
                            <strong>Exemple :</strong> Un casier de vingt-quatre bouteilles correspond à Type "Casier" plus vingt-quatre unités par emballage
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================
          SECTION 3 : LIEN AVEC LE MENU (OPTIONNEL)
          Cette section permet d'automatiser les transferts vers le stock opérationnel
          ============================================================ */}
            <Card>
                <CardHeader>
                    <CardTitle>Lien avec le menu (optionnel)</CardTitle>
                    <CardDescription>
                        Connectez ce produit d&#39;entrepôt à un produit de votre menu pour faciliter les transferts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Sélection du produit menu */}
                    <div className="space-y-2">
                        <Label htmlFor="linkedProductId">Produit du menu</Label>
                        <Select
                            value={formData.linkedProductId}
                            onValueChange={(value) => handleChange('linkedProductId', value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="linkedProductId">
                                <SelectValue placeholder="Aucun lien" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Aucun lien</SelectItem>
                                {availableProducts.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                        {product.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Laissez vide si ce produit n'a pas d'équivalent direct dans votre menu
                        </p>
                    </div>

                    {/* Ratio de conversion - visible uniquement si un produit est sélectionné */}
                    {formData.linkedProductId && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="conversionRatio">
                                    Ratio de conversion <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="conversionRatio"
                                    type="number"
                                    min={0.01}
                                    step={0.01}
                                    placeholder="Ex: 24"
                                    value={formData.conversionRatio}
                                    onChange={(e) => handleChange('conversionRatio', parseFloat(e.target.value) || 1)}
                                    required
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Nombre d'unités du produit menu obtenues pour un {formData.storageUnit}
                                </p>
                            </div>

                            {/* Aperçu visuel de la conversion en temps réel */}
                            {selectedProduct && (
                                <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                        Aperçu de la conversion
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                                        <span>1 {formData.storageUnit}</span>
                                        <span>→</span>
                                        <span className="font-semibold">
                      {formData.conversionRatio} × {selectedProduct.name}
                    </span>
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                        Lors d'un transfert, un {formData.storageUnit} de votre entrepôt ajoutera automatiquement {formData.conversionRatio} unités dans votre stock opérationnel
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ============================================================
          SECTION 4 : STOCK INITIAL (CRÉATION UNIQUEMENT)
          Cette section permet de définir le stock de départ et sa valorisation
          ============================================================ */}
            {!isEditing && (
                <Card>
                    <CardHeader>
                        <CardTitle>Stock initial</CardTitle>
                        <CardDescription>
                            Définissez le stock de départ et le coût d'achat (optionnel)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="initialQuantity">Quantité initiale</Label>
                                <Input
                                    id="initialQuantity"
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={formData.initialQuantity}
                                    onChange={(e) => handleChange('initialQuantity', parseInt(e.target.value) || 0)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Combien de {formData.storageUnit}s avez-vous actuellement
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unitCost">Coût unitaire (FCFA)</Label>
                                <Input
                                    id="unitCost"
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    placeholder="0"
                                    value={formData.unitCost}
                                    onChange={(e) => handleChange('unitCost', parseFloat(e.target.value) || 0)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Coût d'achat par {formData.storageUnit}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="alertThreshold">Seuil d'alerte</Label>
                                <Input
                                    id="alertThreshold"
                                    type="number"
                                    min={0}
                                    placeholder="10"
                                    value={formData.alertThreshold}
                                    onChange={(e) => handleChange('alertThreshold', parseInt(e.target.value) || 10)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Être alerté quand le stock descend sous ce seuil
                                </p>
                            </div>
                        </div>

                        {/* Calcul automatique de la valeur totale du stock initial */}
                        {formData.initialQuantity > 0 && formData.unitCost > 0 && (
                            <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-900 dark:text-green-100">
                                    <strong>Valeur totale initiale :</strong>{' '}
                                    {(formData.initialQuantity * formData.unitCost).toLocaleString('fr-FR')} FCFA
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                    Cette valeur sera enregistrée dans votre comptabilité
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ============================================================
          ACTIONS DU FORMULAIRE
          Boutons d'annulation et de soumission
          ============================================================ */}
            <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                >
                    Annuler
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2 min-w-[200px]">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoading
                        ? 'Enregistrement en cours...'
                        : isEditing
                            ? 'Enregistrer les modifications'
                            : 'Créer le produit'}
                </Button>
            </div>
        </form>
    )
}
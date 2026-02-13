'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import {
    createWarehouseProduct,
    updateWarehouseProduct,
} from '@/lib/actions/warehouse'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'

type MenuProductOption = {
    id: string
    name: string
    imageUrl: string | null
}

type WarehouseProductFormProps = {
    initialData?: {
        id: string
        name: string
        imageUrl?: string | null
        unitsPerStorage: number
        storageUnit: string
        linkedProductId?: string
        conversionRatio?: number
    }
    availableProducts?: MenuProductOption[]
}

export function WarehouseProductForm({
    initialData,
    availableProducts = [],
}: WarehouseProductFormProps) {
    const router = useRouter()
    const isEditing = !!initialData

    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        imageUrl: initialData?.imageUrl || '',
        unitsPerStorage: initialData?.unitsPerStorage || 1,
        storageUnit: initialData?.storageUnit || 'unité',
        linkedProductId: initialData?.linkedProductId || '',
        conversionRatio: initialData?.conversionRatio || 1,
    })

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === 'unitsPerStorage' ||
                name === 'conversionRatio'
                    ? Number(value)
                    : value,
        }))
    }

    function handleSelectChange(field: string, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error('Erreur de validation', {
                description: 'Le nom du produit est requis',
            })
            return
        }

        if (!formData.storageUnit.trim()) {
            toast.error('Erreur de validation', {
                description: "L'unité de stockage est requise",
            })
            return
        }

        if (formData.unitsPerStorage < 1) {
            toast.error('Erreur de validation', {
                description:
                    "Le nombre d'unités par emballage doit être au moins 1",
            })
            return
        }

        if (formData.linkedProductId && formData.conversionRatio <= 0) {
            toast.error('Erreur de validation', {
                description:
                    "Le ratio de conversion doit être supérieur à 0",
            })
            return
        }

        setIsLoading(true)

        try {
            const result = isEditing
                ? await updateWarehouseProduct({
                      id: initialData!.id,
                      ...formData,
                  })
                : await createWarehouseProduct(formData)

            if (result.success) {
                toast.success(
                    isEditing
                        ? 'Produit modifié'
                        : 'Produit créé',
                    {
                        description: `${formData.name} a été ${
                            isEditing ? 'modifié' : 'créé'
                        } avec succès`,
                    }
                )

                router.push('/dashboard/warehouse')
                router.refresh()
            } else {
                toast.error('Erreur', {
                    description:
                        result.error || 'Une erreur est survenue',
                })
            }
        } catch {
            toast.error('Erreur', {
                description: 'Une erreur inattendue est survenue',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const linkedProduct =
        availableProducts.find(
            (p) => p.id === formData.linkedProductId
        )

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            {/* Nom */}
            <div className="space-y-2">
                <Label htmlFor="name">Nom du produit</Label>
                <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                />
            </div>

            {/* Unité de stockage */}
            <div className="space-y-2">
                <Label htmlFor="storageUnit">Unité de stockage</Label>
                <Input
                    id="storageUnit"
                    name="storageUnit"
                    value={formData.storageUnit}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="ex: bouteille, carton, kg"
                />
            </div>

            {/* Image */}
            <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    disabled={isLoading}
                />
            </div>

            {/* Quantité par emballage */}
            <div className="space-y-2">
                <Label htmlFor="unitsPerStorage">
                    Unités par emballage
                </Label>
                <Input
                    id="unitsPerStorage"
                    name="unitsPerStorage"
                    type="number"
                    min={1}
                    value={formData.unitsPerStorage}
                    onChange={handleChange}
                    disabled={isLoading}
                />
            </div>

            {/* Lien avec produit menu (optionnel) */}
            {availableProducts.length > 0 && (
                <div className="space-y-2">
                    <Label htmlFor="linkedProductId">
                        Produit du menu (optionnel)
                    </Label>
                    <Select
                        value={formData.linkedProductId}
                        onValueChange={(val) =>
                            handleSelectChange('linkedProductId', val)
                        }
                        disabled={isLoading}
                    >
                        <SelectTrigger id="linkedProductId">
                            <SelectValue placeholder="Aucun lien" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                Aucun lien
                            </SelectItem>
                            {availableProducts.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {formData.linkedProductId && (
                        <div className="space-y-2 mt-2">
                            <Label htmlFor="conversionRatio">
                                Ratio de conversion
                            </Label>
                            <Input
                                id="conversionRatio"
                                name="conversionRatio"
                                type="number"
                                step={0.01}
                                min={0.01}
                                value={formData.conversionRatio}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                            {linkedProduct && (
                                <p className="text-sm text-muted-foreground">
                                    1 {formData.storageUnit} →{' '}
                                    {formData.conversionRatio} ×{' '}
                                    {linkedProduct.name}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
            >
                {isLoading
                    ? 'Enregistrement...'
                    : isEditing
                    ? 'Mettre à jour'
                    : 'Créer le produit'}
            </Button>
        </form>
    )
}

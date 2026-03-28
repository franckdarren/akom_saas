// app/dashboard/restaurants/[id]/settings/restaurant-settings-form.tsx
'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {CoverImageUploader} from '@/components/dashboard/cover-image-uploader'
import {ImageUploader} from '@/components/image-uploader'
import {CatalogLinkSection} from '@/components/dashboard/catalog-link-section'
import {updateRestaurantSettings} from '@/lib/actions/restaurant'
import {toast} from 'sonner'
import type {ActivityLabels} from '@/lib/config/activity-labels' // ← NOUVEAU

interface Restaurant {
    id: string
    name: string
    slug: string
    phone: string | null
    address: string | null
    logoUrl: string | null
    coverImageUrl: string | null
    isActive: boolean
}

interface RestaurantSettingsFormProps {
    restaurant: Restaurant
    labels: ActivityLabels // ← NOUVEAU
}

export function RestaurantSettingsForm({restaurant, labels}: RestaurantSettingsFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [name, setName] = useState(restaurant.name)
    const [phone, setPhone] = useState(restaurant.phone || '')
    const [address, setAddress] = useState(restaurant.address || '')
    const [logoUrl, setLogoUrl] = useState<string | null>(restaurant.logoUrl)
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(restaurant.coverImageUrl)
    const [isActive, setIsActive] = useState(restaurant.isActive)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await updateRestaurantSettings(restaurant.id, {
                name,
                phone: phone || undefined,
                address: address || undefined,
                logoUrl,
                coverImageUrl,
                isActive,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Paramètres mis à jour avec succès')
                router.refresh()
            }
        } catch (error) {
            toast.error('Une erreur est survenue')
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Image de couverture */}
            <Card>
                <CardHeader>
                    {/* ← Label dynamique */}
                    <CardTitle>📸 {labels.coverImageLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                    <CoverImageUploader
                        value={coverImageUrl}
                        onUploadComplete={(url) => setCoverImageUrl(url)}
                        onRemove={() => setCoverImageUrl(null)}
                        disabled={isSubmitting}
                    />
                </CardContent>
            </Card>

            {/* Informations générales */}
            <Card>
                <CardHeader>
                    <CardTitle>🏢 Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        {/* ← Label dynamique */}
                        <Label htmlFor="name" className="mb-2">{labels.nameFieldLabel} *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={`Ex: ${restaurant.name}`}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <Label htmlFor="phone" className="mb-2">Téléphone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ex: +241 01 23 45 67"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <Label htmlFor="address" className="mb-2">Adresse</Label>
                        <Textarea
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Ex: Quartier Nombakélé, Libreville"
                            disabled={isSubmitting}
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Lien catalogue public */}
            <CatalogLinkSection
                restaurantSlug={restaurant.slug}
                restaurantName={restaurant.name}
            />

            {/* Logo */}
            <Card>
                <CardHeader>
                    {/* ← Label dynamique */}
                    <CardTitle>🎨 {labels.logoLabel} (optionnel)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ImageUploader
                        value={logoUrl}
                        onUploadComplete={(url) => setLogoUrl(url)}
                        onRemove={() => setLogoUrl(null)}
                        disabled={isSubmitting}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                        Le logo peut être utilisé dans les emails et documents
                    </p>
                </CardContent>
            </Card>

            {/* Statut */}
            <Card>
                <CardHeader>
                    {/* ← Label dynamique */}
                    <CardTitle>⚙️ Statut {isActive ? 'actif' : 'inactif'} — {labels.structureNameCapital}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            disabled={isSubmitting}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="isActive" className="cursor-pointer">
                            {labels.structureNameCapital} active
                            <span className="text-sm text-muted-foreground ml-1">
                                {isActive
                                    ? `(les ${labels.customerNameCapital}s peuvent accéder au ${labels.catalogName} et passer ${labels.orderName})`
                                    : `(le ${labels.catalogName} est désactivé, les ${labels.customerNameCapital}s ne peuvent plus commander)`}
                            </span>
                        </Label>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                >
                    Annuler
                </Button>
                <LoadingButton type="submit" isLoading={isSubmitting} loadingText="Enregistrement...">
                    Enregistrer les modifications
                </LoadingButton>
            </div>
        </form>
    )
}
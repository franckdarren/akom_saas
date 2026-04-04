// app/onboarding/create-restaurant-form.tsx
'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {AppCard, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/app-card'
import {createRestaurant} from '@/lib/actions/restaurant'
import {
    ACTIVITY_TYPE_OPTIONS,
    type ActivityType,
} from '@/lib/config/activity-labels'
import {cn} from '@/lib/utils'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'

export function CreateRestaurantForm() {
    const router = useRouter()
    const {startLoading} = useNavigationLoading()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activityType, setActivityType] = useState<ActivityType>('restaurant')

    // Labels dynamiques selon le type d'activité sélectionné
    const selectedActivity = ACTIVITY_TYPE_OPTIONS.find(o => o.value === activityType)!

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const phone = formData.get('phone') as string
        const address = formData.get('address') as string

        const result = await createRestaurant({
            name,
            phone: phone || undefined,
            address: address || undefined,
            activityType,
        })

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
            return
        }

        startLoading()
        router.push('/dashboard')
    }

    return (
        <AppCard variant="flat" className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
                <div className="text-4xl mb-2">{selectedActivity.emoji}</div>
                <CardTitle className="text-xl">
                    {selectedActivity.value === 'restaurant'
                        ? 'Créer mon espace'
                        : `Créer ${
                            ['a', 'e', 'i', 'o', 'u', 'é', 'è', 'ê', 'ë', 'â', 'î', 'ô', 'û'].includes(
                                selectedActivity.label[0].toLowerCase()
                            )
                                ? 'mon'
                                : 'mon'
                        } espace`}
                </CardTitle>
                <CardDescription>
                    Configurez votre structure en quelques secondes
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* ── Sélection du type d'activité ── */}
                    <div className="space-y-2">
                        <Label>Type d&apos;activité</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ACTIVITY_TYPE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setActivityType(option.value)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                                        'hover:border-primary/50 hover:bg-accent',
                                        activityType === option.value
                                            ? 'border-primary bg-primary/5 text-primary font-medium'
                                            : 'border-border text-muted-foreground'
                                    )}
                                >
                                    <span className="text-base shrink-0">{option.emoji}</span>
                                    <div className="min-w-0">
                                        <div className="truncate font-medium leading-tight text-foreground">
                                            {option.label}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {option.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Nom de la structure ── */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nom {activityType === 'restaurant' ? 'du restaurant' :
                            activityType === 'retail' ? 'de la boutique' :
                                activityType === 'transport' ? 'de la compagnie' :
                                    activityType === 'vehicle_rental' ? "de l'agence" :
                                        activityType === 'service_rental' ? "de l'entreprise" :
                                            activityType === 'hotel' ? "de l'établissement" :
                                                activityType === 'beauty' ? 'du salon' :
                                                    'de la structure'}
                            {' '}<span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder={selectedActivity
                                ? ACTIVITY_TYPE_OPTIONS.find(o => o.value === activityType)?.label
                                : 'ex : Chez Maman...'}
                            required
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    {/* ── Téléphone ── */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="ex : +241 07 00 00 00"
                            disabled={isLoading}
                        />
                    </div>

                    {/* ── Adresse ── */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Input
                            id="address"
                            name="address"
                            placeholder="ex : Libreville, Quartier Louis"
                            disabled={isLoading}
                        />
                    </div>

                    {/* ── Erreur ── */}
                    {error && (
                        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                            {error}
                        </p>
                    )}

                    {/* ── Bouton ── */}
                    <LoadingButton type="submit" className="w-full" isLoading={isLoading} loadingText="Création en cours...">
                        Créer mon espace
                    </LoadingButton>
                </form>
            </CardContent>
        </AppCard>
    )
}
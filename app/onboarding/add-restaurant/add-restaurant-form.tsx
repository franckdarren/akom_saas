// app/onboarding/add-restaurant/add-restaurant-form.tsx
'use client'

import {useState, useTransition} from 'react'
import {useRouter} from 'next/navigation'
import {createAdditionalRestaurant} from '@/lib/actions/restaurant'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {toast} from 'sonner'
import {Loader2} from 'lucide-react'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'
import {cn} from '@/lib/utils'
import {ACTIVITY_TYPE_OPTIONS, type ActivityType} from '@/lib/config/activity-labels'

export function AddRestaurantForm() {
    const router = useRouter()
    const {startLoading} = useNavigationLoading()
    const [isPending, startTransition] = useTransition()

    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [activityType, setActivityType] = useState<ActivityType>('restaurant')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Le nom de la structure est requis')
            return
        }

        startTransition(async () => {
            try {
                await createAdditionalRestaurant({
                    name: name.trim(),
                    phone: phone.trim() || undefined,
                    address: address.trim() || undefined,
                    activityType,
                })

                toast.success(`"${name}" créé avec succès !`, {
                    description: 'Vous pouvez maintenant y accéder depuis la sidebar.',
                })

                startLoading()
                router.push('/dashboard')
                router.refresh()
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Une erreur est survenue'
                toast.error(message)
            }
        })
    }

    // Label du placeholder selon le type sélectionné
    const selectedOption = ACTIVITY_TYPE_OPTIONS.find(o => o.value === activityType)

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Type d'activité ── */}
            <div className="space-y-2">
                <Label>Type d'activité</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ACTIVITY_TYPE_OPTIONS.map(({value, label, description, emoji}) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setActivityType(value)}
                            className={cn(
                                'flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
                                'hover:border-primary/50 hover:bg-primary/5',
                                activityType === value
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'border-border bg-background'
                            )}
                        >
                            <span className="text-xl leading-none mt-0.5 shrink-0">{emoji}</span>
                            <div>
                                <p className="text-sm font-medium leading-tight">{label}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Nom ── */}
            <div className="space-y-1.5">
                <Label htmlFor="name">
                    Nom de la structure <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={
                        activityType === 'restaurant' ? 'ex: Chez Maman Centre-ville' :
                            activityType === 'retail' ? 'ex: Boutique Akôm Libreville' :
                                activityType === 'vehicle_rental' ? 'ex: AutoLoc Express' :
                                    activityType === 'transport' ? 'ex: Trans Gabon Express' :
                                        activityType === 'service_rental' ? 'ex: TechLoc Services' :
                                            activityType === 'hotel' ? 'ex: Hôtel du Lac' :
                                                activityType === 'beauty' ? 'ex: Salon Élégance' :
                                                    selectedOption?.label ?? 'Nom de votre structure'
                    }
                    disabled={isPending}
                    required
                />
            </div>

            {/* ── Téléphone ── */}
            <div className="space-y-1.5">
                <Label htmlFor="phone">
                    Téléphone{' '}
                    <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <Input
                    id="phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+241 XX XX XX XX"
                    disabled={isPending}
                />
            </div>

            {/* ── Adresse ── */}
            <div className="space-y-1.5">
                <Label htmlFor="address">
                    Adresse{' '}
                    <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <Input
                    id="address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="ex: Quartier Louis, Libreville"
                    disabled={isPending}
                />
            </div>

            {/* ── Submit ── */}
            <Button
                type="submit"
                className="w-full"
                disabled={isPending || !name.trim()}
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        Création en cours…
                    </>
                ) : (
                    'Créer la structure'
                )}
            </Button>
        </form>
    )
}
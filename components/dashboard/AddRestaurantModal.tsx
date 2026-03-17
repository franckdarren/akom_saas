// components/dashboard/AddRestaurantModal.tsx
'use client'

import {useState, useTransition, useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {createAdditionalRestaurant} from '@/lib/actions/restaurant'
import {ACTIVITY_TYPE_OPTIONS, type ActivityType} from '@/lib/config/activity-labels'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {toast} from 'sonner'
import {
    ArrowLeft, ArrowRight, Building2, CheckCircle2,
    Loader2, MapPin, Phone, Sparkles,
} from 'lucide-react'
import {cn} from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AddRestaurantModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Step = 'type' | 'info' | 'success'

// ─── Composant ────────────────────────────────────────────────────────────────
export function AddRestaurantModal({open, onOpenChange}: AddRestaurantModalProps) {
    const router = useRouter()
    const {startLoading} = useNavigationLoading()
    const {refreshRestaurants, setCurrentRestaurant, restaurants} = useRestaurant()

    const [step, setStep]                 = useState<Step>('type')
    const [activityType, setActivityType] = useState<ActivityType>('restaurant')
    const [name, setName]                 = useState('')
    const [phone, setPhone]               = useState('')
    const [address, setAddress]           = useState('')
    const [createdName, setCreatedName]   = useState('')
    const [isPending, startTransition]    = useTransition()

    // Reset quand on ferme
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep('type')
                setActivityType('restaurant')
                setName('')
                setPhone('')
                setAddress('')
                setCreatedName('')
            }, 300)
        }
    }, [open])

    const selectedOption = ACTIVITY_TYPE_OPTIONS.find(o => o.value === activityType)

    function handleSelectType(type: ActivityType) {
        setActivityType(type)
    }

    function handleNextStep() {
        if (step === 'type') setStep('info')
    }

    function handleBack() {
        if (step === 'info') setStep('type')
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) { toast.error('Le nom est requis'); return }

        startTransition(async () => {
            try {
                const result = await createAdditionalRestaurant({
                    name: name.trim(),
                    phone: phone.trim() || undefined,
                    address: address.trim() || undefined,
                    activityType,
                })

                if (!result.success) {
                    toast.error((result as any).error ?? 'Une erreur est survenue')
                    return
                }

                setCreatedName(name.trim())
                setStep('success')

                // Refresh du context pour que le switcher se mette à jour
                await refreshRestaurants()

            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Une erreur est survenue'
                toast.error(message)
            }
        })
    }

    function handleGoToNewRestaurant() {
        onOpenChange(false)
        startLoading()
        // Le refresh met à jour le layout avec le nouveau restaurant
        router.refresh()
    }

    // ── Indicateur d'étapes ────────────────────────────────────────────────
    const steps = [
        {key: 'type', label: 'Type'},
        {key: 'info', label: 'Infos'},
        {key: 'success', label: 'Créé'},
    ]
    const currentStepIndex = steps.findIndex(s => s.key === step)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                'gap-0 p-0 overflow-hidden',
                // Taille adaptée à l'étape
                step === 'type'    && 'max-w-2xl',
                step === 'info'    && 'max-w-md',
                step === 'success' && 'max-w-sm',
            )}>

                {/* ── Header ── */}
                {step !== 'success' && (
                    <div className="px-6 pt-6 pb-4 border-b">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <DialogTitle className="text-lg font-semibold">
                                    {step === 'type' && 'Quelle est votre activité ?'}
                                    {step === 'info' && (
                                        <span className="flex items-center gap-2">
                                            <span className="text-xl">{selectedOption?.emoji}</span>
                                            {selectedOption?.label}
                                        </span>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                                    {step === 'type' && 'Sélectionnez le type de structure à créer.'}
                                    {step === 'info' && 'Renseignez les informations de votre nouvelle structure.'}
                                </DialogDescription>
                            </div>

                            {/* Indicateur étapes */}
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                {steps.slice(0, 2).map((s, i) => (
                                    <div key={s.key} className="flex items-center gap-1.5">
                                        <div className={cn(
                                            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                                            i < currentStepIndex
                                                ? 'bg-primary text-primary-foreground'
                                                : i === currentStepIndex
                                                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                                                    : 'bg-muted text-muted-foreground'
                                        )}>
                                            {i < currentStepIndex ? <CheckCircle2 className="h-3.5 w-3.5"/> : i + 1}
                                        </div>
                                        {i < 1 && (
                                            <div className={cn(
                                                'h-px w-6 transition-all duration-500',
                                                i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                                            )}/>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════
                    ÉTAPE 1 : Sélection du type d'activité
                ════════════════════════════════════════════════ */}
                {step === 'type' && (
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {ACTIVITY_TYPE_OPTIONS.map(({value, label, description, emoji}) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleSelectType(value)}
                                    className={cn(
                                        'group relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-center',
                                        'transition-all duration-200 cursor-pointer',
                                        'hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm',
                                        activityType === value
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-border bg-background'
                                    )}
                                >
                                    {/* Check */}
                                    {activityType === value && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary"/>
                                        </div>
                                    )}

                                    {/* Emoji */}
                                    <span className={cn(
                                        'text-3xl transition-transform duration-200',
                                        'group-hover:scale-110',
                                        activityType === value && 'scale-110'
                                    )}>
                                        {emoji}
                                    </span>

                                    {/* Label */}
                                    <div>
                                        <p className={cn(
                                            'text-xs font-semibold leading-tight',
                                            activityType === value ? 'text-primary' : 'text-foreground'
                                        )}>
                                            {label}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                                            {description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{selectedOption?.emoji}</span>
                                <span className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">{selectedOption?.label}</span>
                                    {' '}sélectionné
                                </span>
                            </div>
                            <Button onClick={handleNextStep} className="gap-1.5">
                                Continuer
                                <ArrowRight className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════
                    ÉTAPE 2 : Informations de la structure
                ════════════════════════════════════════════════ */}
                {step === 'info' && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">

                        {/* Nom */}
                        <div className="space-y-1.5">
                            <Label htmlFor="modal-name" className="text-sm font-medium">
                                Nom de la structure <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    id="modal-name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={
                                        activityType === 'restaurant'      ? 'ex: Chez Maman Centre-ville' :
                                        activityType === 'retail'          ? 'ex: Boutique Lumière' :
                                        activityType === 'vehicle_rental'  ? 'ex: AutoLoc Express' :
                                        activityType === 'transport'       ? 'ex: Trans Gabon Express' :
                                        activityType === 'service_rental'  ? 'ex: TechLoc Services' :
                                        activityType === 'hotel'           ? 'ex: Hôtel du Lac' :
                                        activityType === 'beauty'          ? 'ex: Salon Élégance' :
                                        'Nom de votre structure'
                                    }
                                    className="pl-9"
                                    autoFocus
                                    disabled={isPending}
                                    required
                                />
                            </div>
                        </div>

                        {/* Téléphone */}
                        <div className="space-y-1.5">
                            <Label htmlFor="modal-phone" className="text-sm font-medium">
                                Téléphone
                                <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optionnel)</span>
                            </Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    id="modal-phone"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="+241 XX XX XX XX"
                                    className="pl-9"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        {/* Adresse */}
                        <div className="space-y-1.5">
                            <Label htmlFor="modal-address" className="text-sm font-medium">
                                Adresse
                                <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optionnel)</span>
                            </Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    id="modal-address"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="ex: Quartier Louis, Libreville"
                                    className="pl-9"
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleBack}
                                disabled={isPending}
                                className="gap-1.5"
                            >
                                <ArrowLeft className="h-4 w-4"/>
                                Retour
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 gap-1.5"
                                disabled={isPending || !name.trim()}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                        Création…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4"/>
                                        Créer la structure
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {/* ════════════════════════════════════════════════
                    ÉTAPE 3 : Succès
                ════════════════════════════════════════════════ */}
                {step === 'success' && (
                    <div className="p-8 flex flex-col items-center text-center gap-4">
                        {/* Icône succès animée */}
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400"/>
                            </div>
                            {/* Halo */}
                            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"/>
                        </div>

                        <div className="space-y-1.5">
                            <h2 className="text-lg font-bold">Structure créée !</h2>
                            <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">{createdName}</span>
                                {' '}est prête. Commencez par configurer votre catalogue et vos tables.
                            </p>
                        </div>

                        {/* Infos rapides */}
                        <div className="w-full rounded-lg border bg-muted/30 p-3 space-y-2 text-left">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Prochaines étapes
                            </p>
                            {[
                                {emoji: '📋', text: 'Créer vos catégories et produits'},
                                {emoji: '🪑', text: 'Configurer vos tables / espaces'},
                                {emoji: '⚙️', text: 'Paramétrer votre profil'},
                            ].map(({emoji, text}) => (
                                <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                    <span className="text-base">{emoji}</span>
                                    {text}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col w-full gap-2">
                            <Button onClick={handleGoToNewRestaurant} className="w-full gap-1.5">
                                <Sparkles className="h-4 w-4"/>
                                Accéder à {createdName}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="w-full text-muted-foreground"
                            >
                                Rester sur la structure actuelle
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
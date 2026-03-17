// components/dashboard/AddRestaurantModal.tsx
'use client'

import {useState, useTransition, useEffect, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {createAdditionalRestaurant} from '@/lib/actions/restaurant'
import {ACTIVITY_TYPE_OPTIONS, type ActivityType} from '@/lib/config/activity-labels'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {toast} from 'sonner'
import {
    ArrowLeft, ArrowRight, Building2, CheckCircle2,
    Loader2, MapPin, Phone, Sparkles, ChevronRight,
} from 'lucide-react'
import {cn} from '@/lib/utils'

interface AddRestaurantModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Step = 'type' | 'info' | 'success'

export function AddRestaurantModal({open, onOpenChange}: AddRestaurantModalProps) {
    const router = useRouter()
    const {startLoading} = useNavigationLoading()
    const {refreshRestaurants} = useRestaurant()

    const [step, setStep]                 = useState<Step>('type')
    const [activityType, setActivityType] = useState<ActivityType>('restaurant')
    const [name, setName]                 = useState('')
    const [phone, setPhone]               = useState('')
    const [address, setAddress]           = useState('')
    const [createdName, setCreatedName]   = useState('')
    const [isPending, startTransition]    = useTransition()

    const isNavigatingRef = useRef(false)

    function resetForm() {
        setStep('type')
        setActivityType('restaurant')
        setName('')
        setPhone('')
        setAddress('')
        setCreatedName('')
    }

    useEffect(() => {
        if (!open && !isNavigatingRef.current) {
            const t = setTimeout(resetForm, 300)
            return () => clearTimeout(t)
        }
    }, [open])

    function handleOpenChange(next: boolean) {
        if (isPending) return
        if (!next) {
            isNavigatingRef.current = false
            onOpenChange(false)
        } else {
            onOpenChange(true)
        }
    }

    const selectedOption = ACTIVITY_TYPE_OPTIONS.find(o => o.value === activityType)

    function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Le nom est requis'); return }

    startTransition(async () => {
        try {
            const result = await createAdditionalRestaurant({
                name:         name.trim(),
                phone:        phone.trim() || undefined,
                address:      address.trim() || undefined,
                activityType,
            })

            // ✅ La fonction throw en cas d'erreur métier,
            // mais on vérifie aussi result.success par sécurité
            if (result && !result.success) {
                toast.error((result as any).error ?? 'Une erreur est survenue')
                return
            }

            // ✅ Toast de confirmation AVANT de changer d'étape
            toast.success(`"${name.trim()}" créée avec succès !`, {
                description: 'Votre nouvelle structure est prête à être configurée.',
            })

            setCreatedName(name.trim())
            setStep('success')
            await refreshRestaurants()

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Une erreur est survenue'
            toast.error(message)
        }
    })
}

    function handleGoToNewRestaurant() {
        isNavigatingRef.current = true
        onOpenChange(false)
        setTimeout(() => {
            isNavigatingRef.current = false
            resetForm()
            startLoading()
            router.refresh()
        }, 350)
    }

    function handleStayHere() {
        isNavigatingRef.current = false
        onOpenChange(false)
    }

    const currentStepIndex = step === 'type' ? 0 : step === 'info' ? 1 : 2

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className={cn(
                'gap-0 p-0 overflow-hidden border-0 shadow-2xl',
                step === 'type'    && 'max-w-2xl',
                step === 'info'    && 'max-w-lg',
                step === 'success' && 'max-w-sm',
            )}>

                {/* ── Header ── */}
                {step !== 'success' && (
                    <div className="px-6 pt-6 pb-5 border-b bg-gradient-to-b from-muted/40 to-transparent">

                        {/* ✅ Titre + indicateur sur la même ligne
                            La croix shadcn est positionnée absolute à top-4 right-4 (≈ 16px)
                            On réserve pr-24 pour ne jamais chevaucher ni le bouton croix ni l'indicateur */}
                        <div className="flex items-start justify-between gap-3 pr-8">
                            {/* Texte à gauche */}
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-semibold leading-snug">
                                    {step === 'type' && 'Quelle est votre activité ?'}
                                    {step === 'info' && (
                                        <span className="flex items-center gap-2">
                                            <span className="text-lg">{selectedOption?.emoji}</span>
                                            {selectedOption?.label}
                                        </span>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                    {step === 'type' && 'Sélectionnez le type de structure à créer.'}
                                    {step === 'info' && 'Renseignez les informations de votre nouvelle structure.'}
                                </DialogDescription>
                            </div>

                            {/* ✅ Indicateur de progression — à gauche de la croix
                                La croix shadcn est à right-4, on lui laisse ~32px.
                                On positionne l'indicateur juste avant avec mr qui le décale. */}
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5 mr-6">
                                {(['type', 'info'] as Step[]).map((s, i) => (
                                    <div
                                        key={s}
                                        className={cn(
                                            'h-1.5 rounded-full transition-all duration-500',
                                            s === step
                                                ? 'w-6 bg-primary'
                                                : currentStepIndex > i
                                                    ? 'w-3 bg-primary/50'
                                                    : 'w-3 bg-muted-foreground/20'
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════
                    ÉTAPE 1 : Type d'activité
                ══════════════════════════════════════ */}
                {step === 'type' && (
                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ACTIVITY_TYPE_OPTIONS.map(({value, label, description, emoji}) => {
                                const isSelected = activityType === value
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setActivityType(value)}
                                        className={cn(
                                            'group relative flex flex-col items-center gap-2 rounded-xl p-3.5 text-center',
                                            'border-2 transition-all duration-200 cursor-pointer',
                                            'hover:shadow-md',
                                            isSelected
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30'
                                        )}
                                    >
                                        {/* Radio visuel */}
                                        <div className={cn(
                                            'absolute top-2 right-2 h-4 w-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
                                            isSelected
                                                ? 'border-primary bg-primary'
                                                : 'border-muted-foreground/30'
                                        )}>
                                            {isSelected && (
                                                <div className="h-1.5 w-1.5 rounded-full bg-white"/>
                                            )}
                                        </div>

                                        <span className={cn(
                                            'text-2xl leading-none transition-transform duration-200',
                                            'group-hover:scale-110',
                                            isSelected && 'scale-110'
                                        )}>
                                            {emoji}
                                        </span>

                                        <div className="space-y-0.5">
                                            <p className={cn(
                                                'text-[11px] font-semibold leading-tight',
                                                isSelected ? 'text-primary' : 'text-foreground'
                                            )}>
                                                {label}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">
                                                {description}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-lg">{selectedOption?.emoji}</span>
                                <span className="text-muted-foreground">
                                    <span className="font-medium text-foreground">{selectedOption?.label}</span>
                                    {' '}sélectionné
                                </span>
                            </div>
                            <Button onClick={() => setStep('info')} size="sm" className="gap-1.5">
                                Continuer
                                <ArrowRight className="h-3.5 w-3.5"/>
                            </Button>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════
                    ÉTAPE 2 : Informations
                ══════════════════════════════════════ */}
                {step === 'info' && (
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="modal-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Nom de la structure{' '}
                                <span className="text-destructive normal-case font-normal tracking-normal">*</span>
                            </Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    id="modal-name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={
                                        activityType === 'restaurant'     ? 'ex: Chez Maman Centre-ville' :
                                        activityType === 'retail'         ? 'ex: Boutique Lumière'        :
                                        activityType === 'vehicle_rental' ? 'ex: AutoLoc Express'         :
                                        activityType === 'transport'      ? 'ex: Trans Gabon Express'     :
                                        activityType === 'service_rental' ? 'ex: TechLoc Services'        :
                                        activityType === 'hotel'          ? 'ex: Hôtel du Lac'            :
                                        activityType === 'beauty'         ? 'ex: Salon Élégance'          :
                                        'Nom de votre structure'
                                    }
                                    className="pl-9 h-10"
                                    autoFocus
                                    disabled={isPending}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="modal-phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Téléphone{' '}
                                    <span className="normal-case font-normal tracking-normal text-muted-foreground/60">(opt.)</span>
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        id="modal-phone"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+241 XX XX XX XX"
                                        className="pl-9 h-10"
                                        disabled={isPending}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="modal-address" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Adresse{' '}
                                    <span className="normal-case font-normal tracking-normal text-muted-foreground/60">(opt.)</span>
                                </Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        id="modal-address"
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="Quartier, Ville"
                                        className="pl-9 h-10"
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('type')}
                                disabled={isPending}
                                className="gap-1.5 text-muted-foreground"
                            >
                                <ArrowLeft className="h-3.5 w-3.5"/>
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
                                        Création en cours…
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

                {/* ══════════════════════════════════════
                    ÉTAPE 3 : Succès
                ══════════════════════════════════════ */}
                {step === 'success' && (
                    <div className="p-8 flex flex-col items-center text-center gap-5">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <CheckCircle2 className="h-8 w-8 text-white"/>
                            </div>
                            <div className="absolute -inset-1 rounded-2xl bg-emerald-400/20 animate-ping"/>
                        </div>

                        <div className="space-y-1">
                            <DialogTitle className="text-lg font-bold">Structure créée !</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">{createdName}</span>
                                {' '}est prête à être configurée.
                            </DialogDescription>
                        </div>

                        <div className="w-full rounded-xl border bg-muted/30 divide-y">
                            {[
                                {emoji: '📋', text: 'Créer vos catégories et produits'},
                                {emoji: '🪑', text: 'Configurer vos tables / espaces'},
                                {emoji: '⚙️', text: 'Paramétrer votre profil'},
                            ].map(({emoji, text}) => (
                                <div key={text} className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground">
                                    <span className="text-base shrink-0">{emoji}</span>
                                    <span>{text}</span>
                                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40"/>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col w-full gap-2">
                            <Button
                                onClick={handleGoToNewRestaurant}
                                className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Sparkles className="h-4 w-4"/>
                                Accéder à {createdName}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleStayHere}
                                className="w-full text-muted-foreground text-sm"
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
// app/dashboard/subscription/choose-plan/PlanCard.tsx
'use client'

import {useState, useMemo} from 'react'
import {useRouter} from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
import {Slider} from '@/components/ui/slider'
import {Check, Users, AlertCircle} from 'lucide-react'
import {
    SUBSCRIPTION_CONFIG,
    formatPrice,
    calculateMonthlyPrice,
    calculateTotalPrice,
    calculateSavings,
    getPricingBreakdown,
    type SubscriptionPlan,
    type BillingCycle,
} from '@/lib/config/subscription'
import {cn} from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Props du composant PlanCard
 *
 * Ce composant affiche une carte interactive pour un plan d'abonnement.
 * L'utilisateur peut ajuster le nombre d'utilisateurs et le cycle de facturation
 * pour voir en temps réel comment le prix évolue.
 */
interface PlanCardProps {
    plan: SubscriptionPlan           // Le plan à afficher (starter, business, premium)
    currentPlan?: SubscriptionPlan   // Le plan actuellement actif de l'utilisateur
    currentUserCount?: number        // Nombre actuel d'utilisateurs dans le restaurant
    restaurantId: string             // ID du restaurant pour la navigation
    recommended?: boolean            // Si true, affiche un badge "Recommandé"
}

/**
 * Composant PlanCard avec sélecteur d'utilisateurs interactif
 *
 * Ce composant est la pierre angulaire de votre interface de pricing.
 * Il permet aux utilisateurs de simuler différentes configurations
 * (nombre d'utilisateurs + cycle de facturation) et de voir immédiatement
 * l'impact sur le prix total. C'est comme un configurateur de voiture où
 * vous choisissez vos options et voyez le prix final se mettre à jour en direct.
 *
 * La transparence est essentielle : nous affichons clairement le prix de base,
 * le coût des utilisateurs supplémentaires, et le total. Pas de frais cachés,
 * pas de surprises. Cette transparence inspire confiance et réduit les frictions
 * à l'achat.
 */
export function PlanCard({
                             plan,
                             currentPlan,
                             currentUserCount = 1,
                             restaurantId,
                             recommended,
                         }: PlanCardProps) {
    const router = useRouter()

    // Récupérer la configuration complète de ce plan
    const config = SUBSCRIPTION_CONFIG[plan]

    // État local pour le cycle de facturation sélectionné
    const [billingCycle, setBillingCycle] = useState<BillingCycle>(1)

    // État local pour le nombre d'utilisateurs sélectionné
    // Par défaut, on utilise le nombre actuel d'utilisateurs du restaurant,
    // avec un minimum de 1 (l'admin est toujours présent)
    const [selectedUserCount, setSelectedUserCount] = useState(
        Math.max(1, currentUserCount)
    )

    // État de chargement pendant la navigation
    const [loading, setLoading] = useState(false)

    // Vérifier si c'est le plan actuellement actif
    const isCurrent = currentPlan === plan

    /**
     * Calcul du nombre maximum d'utilisateurs pour le slider
     *
     * Pour les plans Starter et Business, nous avons une limite fixe.
     * Pour Premium, nous affichons un slider jusqu'à 20 utilisateurs,
     * mais nous indiquons clairement que c'est "illimité" au-delà.
     */
    const maxUsersForSlider = useMemo(() => {
        const maxUsers = config.userPricing.maxUsers
        if (maxUsers === 'unlimited') {
            // Pour Premium, on affiche jusqu'à 20 dans le slider
            // mais on indique que c'est illimité
            return 50
        }
        return maxUsers
    }, [config.userPricing.maxUsers])

    /**
     * Calcul du détail de tarification en temps réel
     *
     * Ce hook mémorisé recalcule tous les détails de pricing chaque fois que
     * l'utilisateur change le nombre d'utilisateurs ou le cycle de facturation.
     * C'est l'équivalent d'un "panier" dans un e-commerce qui se met à jour
     * instantanément quand vous changez vos choix.
     */
    const pricingDetails = useMemo(() => {
        return getPricingBreakdown(plan, selectedUserCount, billingCycle)
    }, [plan, selectedUserCount, billingCycle])

    /**
     * Gestion de la sélection du plan
     *
     * Quand l'utilisateur clique sur "Choisir ce plan", nous le redirigeons
     * vers la page de paiement avec tous les paramètres nécessaires dans l'URL.
     * Ces paramètres permettront à la page de paiement d'afficher le bon
     * récapitulatif et de créer le bon abonnement.
     */
    const handleSelectPlan = () => {
        setLoading(true)
        router.push(
            `/dashboard/subscription/payment?plan=${plan}&cycle=${billingCycle}&users=${selectedUserCount}&restaurantId=${restaurantId}`
        )
    }

    return (
        <Card
            className={cn(
                'relative transition-all duration-200 hover:border-primary/50 hover:shadow-md',
                recommended && 'border-primary shadow-lg scale-105 hover:border-primary/50 hover:shadow-md',
                isCurrent && 'bg-muted/50 hover:border-primary/50 hover:shadow-md'
            )}
        >
            {/* Badge "Recommandé" ou "Plan actuel" */}
            {(recommended || isCurrent) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge
                        variant={recommended ? 'default' : 'secondary'}
                        className="px-3 py-1"
                    >
                        {recommended ? 'Recommandé' : 'Plan actuel'}
                    </Badge>
                </div>
            )}

            <CardHeader className="text-center space-y-4 pt-8 pb-4">
                {/* Nom du plan */}
                <CardTitle className="text-2xl font-bold capitalize">
                    {config.name}
                </CardTitle>

                {/* Tagline du plan */}
                <CardDescription className="text-base">
                    {config.tagline}
                </CardDescription>

                {/* Section de tarification interactive */}
                <div className="space-y-4 pt-2">

                    {/* Prix principal avec décomposition */}
                    <div className="space-y-2">
                        {/* Prix total mensuel */}
                        <div className="text-4xl font-bold tracking-tight text-primary">
                            {formatPrice(pricingDetails.monthlyTotal)}
                            <span className="text-base font-normal text-muted-foreground">
                /mois
              </span>
                        </div>

                        {/* Décomposition du prix (prix de base + supplément utilisateurs) */}
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center justify-center gap-2">
                                <span>Prix de base : {formatPrice(pricingDetails.basePrice)}</span>
                            </div>
                            {pricingDetails.extraUsers > 0 && (
                                <div className="flex items-center justify-center gap-2">
                  <span>
                    + {pricingDetails.extraUsers} utilisateur
                      {pricingDetails.extraUsers > 1 ? 's' : ''} supplémentaire
                      {pricingDetails.extraUsers > 1 ? 's' : ''} : {' '}
                      {formatPrice(pricingDetails.extraUsersCost)}
                  </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sélecteur d'utilisateurs interactif */}
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground"/>
                                <span className="text-sm font-medium">
                  Nombre d&apos;utilisateurs
                </span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help"/>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs text-xs">
                                                Chaque utilisateur inclut l&apos;administrateur, les cuisiniers,
                                                serveurs, et tout autre compte ayant accès au système.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <span className="text-lg font-bold">
                {selectedUserCount}
              </span>
                        </div>

                        {/* Slider pour sélectionner le nombre d'utilisateurs */}
                        <Slider
                            value={[selectedUserCount]}
                            onValueChange={([value]) => setSelectedUserCount(value)}
                            min={1}
                            max={maxUsersForSlider}
                            step={1}
                            className="w-full"
                        />

                        {/* Indication de la limite du plan */}
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1 utilisateur</span>
                            {config.userPricing.maxUsers === 'unlimited' ? (
                                <span className="text-primary font-medium">Illimité ✨</span>
                            ) : (
                                <span>Max {config.userPricing.maxUsers}</span>
                            )}
                        </div>

                        {/* Coût par utilisateur supplémentaire */}
                        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
                            + {formatPrice(config.userPricing.pricePerExtraUser)}/mois
                            par utilisateur supplémentaire
                        </div>
                    </div>

                    {/* Sélecteur de cycle de facturation */}
                    <div className="space-y-2">
                        <Select
                            value={billingCycle.toString()}
                            onValueChange={(value) =>
                                setBillingCycle(Number(value) as BillingCycle)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 mois</SelectItem>
                                <SelectItem value="3">3 mois (-10%)</SelectItem>
                                <SelectItem value="6">6 mois (-15%)</SelectItem>
                                <SelectItem value="12">12 mois (-20%)</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Affichage des économies */}
                        {pricingDetails.discount > 0 && (
                            <div className="text-center">
                                <p className="text-sm font-medium text-green-600">
                                    Économisez {formatPrice(pricingDetails.discount)} avec ce cycle
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total pour {billingCycle} mois : {' '}
                                    {formatPrice(pricingDetails.totalPrice)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Liste des fonctionnalités du plan */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Fonctionnalités incluses
                    </p>
                    {config.marketingFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5"/>
                            <span className="text-sm text-foreground leading-relaxed">
                {feature}
              </span>
                        </div>
                    ))}
                </div>

                {/* Bouton d'action principal */}
                <Button
                    onClick={handleSelectPlan}
                    disabled={loading || isCurrent}
                    className="w-full"
                    size="lg"
                    variant={recommended ? 'default' : 'outline'}
                >
                    {loading ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Chargement...
                        </>
                    ) : isCurrent ? (
                        'Plan actuel'
                    ) : (
                        config.cta || 'Choisir ce plan'
                    )}
                </Button>

                {/* Note sur la limite d'utilisateurs pour les plans limités */}
                {config.userPricing.maxUsers !== 'unlimited' && (
                    <p className="text-xs text-center text-muted-foreground">
                        * Maximum {config.userPricing.maxUsers} utilisateurs sur ce plan.
                        Au-delà, passez au plan supérieur.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
// app/dashboard/subscription/payment/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRestaurantSubscription } from '@/lib/actions/subscription'
import { PaymentForm } from './PaymentForm'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    PLAN_CONFIGS,
    calculatePrice,
    formatPrice,
    type SubscriptionPlan,
    type BillingCycle,
} from '@/lib/subscription/config'

// ============================================================
// Interface des searchParams
// ============================================================

interface SearchParams {
    plan?: string
    cycle?: string
    restaurantId?: string
}

// ============================================================
// Fonction utilitaire : convertir la durée en BillingCycle valide.
// Si la valeur dans l'URL n'est pas dans la liste autorisée,
// on retourne 1 par défaut plutôt que de laisser une valeur
// arbitraire partir en downstream.
// ============================================================

function parseBillingCycle(value: string | undefined): BillingCycle {
    const allowed: BillingCycle[] = [1, 3, 6, 12]
    const parsed = Number(value)
    return allowed.includes(parsed as BillingCycle) ? (parsed as BillingCycle) : 1
}

// ============================================================
// Fonction utilitaire : retourner le libellé de la réduction
// selon la durée choisie. Retourne null si pas de réduction
// (1 mois), ce qui permet de conditionner l'affichage
// proprement dans le JSX sans risque de "false" visible.
// ============================================================

function getDiscountLabel(cycle: BillingCycle): string | null {
    const labels: Partial<Record<BillingCycle, string>> = {
        3: '10%',
        6: '15%',
        12: '20%',
    }
    return labels[cycle] ?? null
}

export default async function PaymentPage({
    searchParams,
}: {
    // En Next.js App Router récent, searchParams est une Promise.
    // On type la prop comme Promise pour être explicite.
    searchParams: Promise<SearchParams>
}) {
    // --------------------------------------------------------
    // ⚡ C'est ICI le fix principal : on await searchParams
    // avant de toucher à ses propriétés. Sans ça, plan/cycle
    // restent undefined et les valeurs par défaut s'appliquent
    // toujours.
    // --------------------------------------------------------
    const params = await searchParams

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Récupérer le restaurant depuis la BDD (on ignore
    // restaurantId du searchParams pour éviter une faille de
    // sécurité : un utilisateur pourrait manipuler l'URL pour
    // payer pour un autre restaurant).
    const { data: restaurantUser } = await supabase
        .from('restaurant_users')
        .select('restaurant_id, restaurants(name)')
        .eq('user_id', user.id)
        .single()

    if (!restaurantUser) {
        redirect('/dashboard')
    }

    const restaurantId = restaurantUser.restaurant_id
    const restaurantName = (restaurantUser.restaurants as any)?.name

    // Extraire plan et cycle depuis les params awaités
    const plan = (params.plan as SubscriptionPlan) || 'starter'
    const billingCycle = parseBillingCycle(params.cycle)

    // Valider que le plan existe bien dans notre config
    if (!['starter', 'business', 'premium'].includes(plan)) {
        redirect('/dashboard/subscription/choose-plan')
    }

    const planConfig = PLAN_CONFIGS[plan]
    const amount = calculatePrice(plan, billingCycle)
    const discountLabel = getDiscountLabel(billingCycle)

    // Récupérer l'abonnement actuel (pour contexte)
    const { subscription } = await getRestaurantSubscription(restaurantId)

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button asChild variant="ghost" className="mb-4">
                        <Link href="/dashboard/subscription/choose-plan">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour au choix du plan
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">
                        Paiement de l'abonnement
                    </h1>
                    <p className="text-gray-600">{restaurantName}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* ------------------------------------------------
                        Colonne gauche : Récapitulatif + infos bancaires
                    ------------------------------------------------ */}
                    <div className="space-y-6">
                        {/* Récapitulatif de la commande */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">
                                Récapitulatif de la commande
                            </h2>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Plan</span>
                                    <span className="font-medium capitalize">
                                        {planConfig.name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Durée</span>
                                    <span className="font-medium">
                                        {billingCycle} mois
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Prix mensuel
                                    </span>
                                    <span className="font-medium">
                                        {formatPrice(planConfig.monthlyPrice)}
                                    </span>
                                </div>

                                {/* Réduction : on n'affiche que si
                                    discountLabel est non-null, ce qui
                                    évite le problème de "false" visible
                                    dans le rendu */}
                                {discountLabel && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Réduction</span>
                                        <span className="font-medium">
                                            -{discountLabel}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t pt-3 mt-3">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total à payer</span>
                                        <span>{formatPrice(amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Informations bancaires */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold mb-4 text-blue-900">
                                Informations de paiement
                            </h2>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="font-medium text-blue-900 mb-1">
                                        Mobile Money
                                    </p>
                                    <div className="bg-white rounded p-3 space-y-1">
                                        <p>
                                            <strong>Airtel Money :</strong> +241
                                            XX XX XX XX
                                        </p>
                                        <p>
                                            <strong>Moov Money :</strong> +241 XX
                                            XX XX XX
                                        </p>
                                        <p className="text-gray-600 text-xs mt-2">
                                            Nom du compte : AKOM SAAS
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="font-medium text-blue-900 mb-1">
                                        Virement bancaire
                                    </p>
                                    <div className="bg-white rounded p-3 space-y-1">
                                        <p>
                                            <strong>Banque :</strong> BGFI Bank
                                        </p>
                                        <p>
                                            <strong>IBAN :</strong> GA21 XXXX XXXX
                                            XXXX XXXX XXXX
                                        </p>
                                        <p>
                                            <strong>Titulaire :</strong> AKOM SAAS
                                        </p>
                                    </div>
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Important</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        Indiquez votre{' '}
                                        <strong>nom de restaurant</strong> dans
                                        le libellé du virement pour faciliter la
                                        validation.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </div>

                        {/* Instructions étape par étape */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="font-semibold mb-3">
                                Comment ça marche ?
                            </h2>
                            <ol className="space-y-2 text-sm text-gray-600">
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">
                                        1.
                                    </span>
                                    Effectuez le paiement via Mobile Money ou
                                    virement bancaire
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">
                                        2.
                                    </span>
                                    Prenez une capture d'écran de la confirmation
                                    de paiement
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">
                                        3.
                                    </span>
                                    Uploadez la preuve via le formulaire
                                    ci-contre
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">
                                        4.
                                    </span>
                                    Notre équipe valide votre paiement sous 24h
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">
                                        5.
                                    </span>
                                    Votre abonnement est activé automatiquement
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* ------------------------------------------------
                        Colonne droite : Formulaire de soumission
                    ------------------------------------------------ */}
                    <div>
                        <PaymentForm
                            restaurantId={restaurantId}
                            plan={plan}
                            billingCycle={billingCycle}
                            amount={amount}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
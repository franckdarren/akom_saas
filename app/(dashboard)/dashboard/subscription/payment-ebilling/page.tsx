// app/dashboard/subscription/payment-ebilling/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRestaurantSubscription } from '@/lib/actions/subscription'
import { EBillingPaymentForm } from './EBillingPaymentForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'
import {
    PLAN_CONFIGS,
    calculatePrice,
    formatPrice,
    type SubscriptionPlan,
    type BillingCycle,
} from '@/lib/subscription/config'
import { calculateCommissionBreakdown } from '@/lib/payment/fees'

interface SearchParams {
    plan?: string
    cycle?: string
}

function parseBillingCycle(value: string | undefined): BillingCycle {
    const allowed: BillingCycle[] = [1, 3, 6, 12]
    const parsed = Number(value)
    return allowed.includes(parsed as BillingCycle) ? (parsed as BillingCycle) : 1
}

function getDiscountLabel(cycle: BillingCycle): string | null {
    const labels: Partial<Record<BillingCycle, string>> = {
        3: '10%',
        6: '15%',
        12: '20%',
    }
    return labels[cycle] ?? null
}

export default async function PaymentEBillingPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

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

    const plan = (params.plan as SubscriptionPlan) || 'starter'
    const billingCycle = parseBillingCycle(params.cycle)

    if (!['starter', 'business', 'premium'].includes(plan)) {
        redirect('/dashboard/subscription/choose-plan')
    }

    const planConfig = PLAN_CONFIGS[plan]
    const amount = calculatePrice(plan, billingCycle)
    const discountLabel = getDiscountLabel(billingCycle)

    // Calculer la décomposition avec frais
    const breakdown = calculateCommissionBreakdown(amount, 'moov') // On prend moov par défaut, sera recalculé selon le choix

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
                        Paiement par Mobile Money
                    </h1>
                    <p className="text-gray-600">{restaurantName}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Colonne gauche : Récapitulatif */}
                    <div className="space-y-6">
                        {/* Récapitulatif de la commande */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">
                                Récapitulatif
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
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Sous-total ({billingCycle} mois)
                                    </span>
                                    <span className="font-medium">
                                        {formatPrice(amount)}
                                    </span>
                                </div>

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
                                    <p className="text-xs text-gray-500 mt-1">
                                        Les frais de transaction seront ajoutés selon votre opérateur
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Informations importantes */}
                        <Alert>
                            <InfoIcon className="h-4 w-4" />
                            <AlertTitle>Paiement instantané</AlertTitle>
                            <AlertDescription className="text-sm space-y-2">
                                <p>
                                    Vous recevrez un code de confirmation sur votre téléphone.
                                    Entrez votre code PIN pour valider le paiement.
                                </p>
                                <p className="text-xs text-gray-600 mt-2">
                                    Votre abonnement sera activé automatiquement dès confirmation du paiement.
                                </p>
                            </AlertDescription>
                        </Alert>

                        {/* Instructions */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="font-semibold mb-3">
                                Comment ça marche ?
                            </h2>
                            <ol className="space-y-2 text-sm text-gray-600">
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">1.</span>
                                    Saisissez votre numéro de téléphone
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">2.</span>
                                    Choisissez votre opérateur (Airtel ou Moov)
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">3.</span>
                                    Cliquez sur "Payer maintenant"
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">4.</span>
                                    Entrez votre code PIN sur votre téléphone
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-semibold text-gray-900">5.</span>
                                    Votre abonnement est activé immédiatement
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* Colonne droite : Formulaire */}
                    <div>
                        <EBillingPaymentForm
                            restaurantId={restaurantId}
                            plan={plan}
                            billingCycle={billingCycle}
                            amount={amount}
                            userName={user.user_metadata?.full_name || user.email || 'Client'}
                            userEmail={user.email || ''}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
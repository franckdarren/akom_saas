// app/dashboard/subscription/payment/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {getRestaurantSubscription} from '@/lib/actions/subscription'
import {PaymentForm} from './PaymentForm'
import {ArrowLeft, AlertCircle, Users} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {
    SUBSCRIPTION_CONFIG,
    formatPrice,
    getPricingBreakdown,
    type SubscriptionPlan,
    type BillingCycle,
} from '@/lib/config/subscription'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {Separator} from '@/components/ui/separator'

// ============================================================
// TYPES
// ============================================================

interface SearchParams {
    plan?: string
    cycle?: string
    users?: string
    restaurantId?: string
}

// ============================================================
// HELPERS
// ============================================================

function parseBillingCycle(value: string | undefined): BillingCycle {
    const allowed: BillingCycle[] = [1, 3, 6, 12]
    const parsed = Number(value)
    return allowed.includes(parsed as BillingCycle)
        ? (parsed as BillingCycle)
        : 1
}

function parseUserCount(value: string | undefined): number {
    const parsed = Number(value)
    if (isNaN(parsed) || parsed < 1) return 1
    if (parsed > 100) return 100
    return Math.floor(parsed)
}

function getDiscountLabel(cycle: BillingCycle): string | null {
    const labels: Partial<Record<BillingCycle, string>> = {
        3: '10%',
        6: '15%',
        12: '20%',
    }
    return labels[cycle] ?? null
}

// ============================================================
// PAGE
// ============================================================

export default async function PaymentPage({
                                              searchParams,
                                          }: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams

    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const {data: restaurantUser} = await supabase
        .from('restaurant_users')
        .select('restaurant_id, restaurants(name)')
        .eq('user_id', user.id)
        .single()

    if (!restaurantUser) redirect('/dashboard')

    const restaurantId = restaurantUser.restaurant_id
    const restaurantName = (restaurantUser.restaurants as any)?.name

    const plan = (params.plan as SubscriptionPlan) || 'starter'
    const billingCycle = parseBillingCycle(params.cycle)
    const userCount = parseUserCount(params.users)

    if (!['starter', 'business', 'premium'].includes(plan)) {
        redirect('/dashboard/subscription/choose-plan')
    }

    const planConfig = SUBSCRIPTION_CONFIG[plan]
    const maxUsers = planConfig.userPricing.maxUsers

    let adjustedUserCount = userCount
    let userCountAdjusted = false

    if (maxUsers !== 'unlimited' && userCount > maxUsers) {
        adjustedUserCount = maxUsers
        userCountAdjusted = true
    }

    const pricing = getPricingBreakdown(
        plan,
        adjustedUserCount,
        billingCycle
    )

    const discountLabel = getDiscountLabel(billingCycle)

    const {subscription} =
        await getRestaurantSubscription(restaurantId)

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">

            {/* HEADER */}
            <div className="space-y-3">
                <Button asChild variant="ghost">
                    <Link href="/dashboard/subscription/choose-plan">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Retour au choix du plan
                    </Link>
                </Button>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Paiement de l'abonnement
                    </h1>
                    <p className="text-muted-foreground">
                        {restaurantName}
                    </p>
                </div>
            </div>

            {/* ALERTE AJUSTEMENT */}
            {userCountAdjusted && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>Nombre d'utilisateurs ajusté</AlertTitle>
                    <AlertDescription>
                        Le plan {planConfig.name} permet un maximum de {maxUsers}{' '}
                        utilisateurs. Votre sélection a été ajustée automatiquement.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-8">

                {/* COLONNE GAUCHE */}
                <div className="space-y-6">

                    {/* RÉCAPITULATIF */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Récapitulatif</CardTitle>
                            <CardDescription>
                                Détail de votre abonnement {planConfig.name}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Plan</span>
                                    <span className="font-semibold capitalize">
                    {planConfig.name}
                  </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Durée</span>
                                    <span className="font-medium">
                    {billingCycle} mois
                  </span>
                                </div>
                            </div>

                            <Separator/>

                            {/* DÉTAIL UTILISATEURS */}
                            <div className="rounded-lg border bg-muted p-4 space-y-4">
                                <div className="flex items-center gap-2 font-medium">
                                    <Users className="h-4 w-4"/>
                                    Détail utilisateurs
                                </div>

                                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Prix de base (admin inclus)
                  </span>
                                    <span>{formatPrice(pricing.basePrice)}</span>
                                </div>

                                {pricing.extraUsers > 0 && (
                                    <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      + {pricing.extraUsers} utilisateur
                        {pricing.extraUsers > 1 ? 's' : ''}
                        <br/>
                      <span className="text-xs">
                        ({formatPrice(pricing.pricePerExtraUser)} ×{' '}
                          {pricing.extraUsers})
                      </span>
                    </span>
                                        <span>
                      {formatPrice(pricing.extraUsersCost)}
                    </span>
                                    </div>
                                )}

                                <Separator/>

                                <div className="flex justify-between font-semibold">
                                    <span>Total mensuel</span>
                                    <span>{formatPrice(pricing.monthlyTotal)}</span>
                                </div>
                            </div>

                            <Separator/>

                            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatPrice(pricing.monthlyTotal)} ×{' '}
                    {billingCycle} mois
                </span>
                                <span>
                  {formatPrice(pricing.totalBeforeDiscount)}
                </span>
                            </div>

                            {pricing.discount > 0 && (
                                <div className="flex justify-between text-sm text-primary">
                                    <span>Réduction ({discountLabel})</span>
                                    <span>
                    -{formatPrice(pricing.discount)}
                  </span>
                                </div>
                            )}

                            <Separator/>

                            <div className="flex justify-between items-center">
                <span className="text-lg font-bold">
                  Total à payer
                </span>
                                <span className="text-2xl font-bold text-primary">
                  {formatPrice(pricing.totalPrice)}
                </span>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4"/>
                                <AlertDescription className="text-xs">
                                    Vous payez pour{' '}
                                    <strong>
                                        {adjustedUserCount} utilisateur
                                        {adjustedUserCount > 1 ? 's' : ''}
                                    </strong>{' '}
                                    sur le plan {planConfig.name}. Toute modification
                                    future ajustera la facturation au prochain
                                    renouvellement.
                                </AlertDescription>
                            </Alert>

                        </CardContent>
                    </Card>

                    {/* INFOS PAIEMENT */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations de paiement</CardTitle>
                            <CardDescription>
                                Mobile Money ou virement bancaire
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6 text-sm">

                            <div>
                                <p className="font-medium mb-2">Mobile Money</p>
                                <div className="rounded-lg border bg-muted p-4 space-y-2">
                                    <p><strong>Airtel Money :</strong> +241 XX XX XX XX</p>
                                    <p><strong>Moov Money :</strong> +241 XX XX XX XX</p>
                                    <p className="text-muted-foreground text-xs">
                                        Nom du compte : AKOM SAAS
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="font-medium mb-2">Virement bancaire</p>
                                <div className="rounded-lg border bg-muted p-4 space-y-2">
                                    <p><strong>Banque :</strong> BGFI Bank</p>
                                    <p><strong>IBAN :</strong> GA21 XXXX XXXX XXXX</p>
                                    <p><strong>Titulaire :</strong> AKOM SAAS</p>
                                </div>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4"/>
                                <AlertTitle>Important</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Indiquez le <strong>nom de votre restaurant</strong>{' '}
                                    dans le libellé du paiement.
                                </AlertDescription>
                            </Alert>

                        </CardContent>
                    </Card>

                </div>

                {/* COLONNE DROITE */}
                <div>
                    <PaymentForm
                        restaurantId={restaurantId}
                        plan={plan}
                        billingCycle={billingCycle}
                        userCount={adjustedUserCount}
                        amount={pricing.totalPrice}
                    />
                </div>

            </div>
        </div>
    )
}
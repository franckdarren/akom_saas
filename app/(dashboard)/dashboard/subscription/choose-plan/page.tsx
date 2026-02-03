// app/dashboard/subscription/choose-plan/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRestaurantSubscription } from '@/lib/actions/subscription'
import { PlanCard } from './PlanCard'
import { PLAN_CONFIGS } from '@/lib/subscription/config'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ChoosePlanPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Récupérer le restaurant
    const { data: restaurantUser } = await supabase
        .from('restaurant_users')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .single()

    if (!restaurantUser) {
        redirect('/dashboard')
    }

    const restaurantId = restaurantUser.restaurant_id

    // Récupérer l'abonnement actuel
    const { subscription } = await getRestaurantSubscription(restaurantId)
    const currentPlan = subscription?.plan

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <Button asChild variant="ghost" className="mb-6">
                        <Link href="/dashboard/subscription">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour à l'abonnement
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-bold mb-3">Choisissez votre plan</h1>
                    <p className="text-xl text-gray-600">
                        Sélectionnez l'offre qui correspond le mieux à vos besoins
                    </p>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <PlanCard
                        plan="starter"
                        config={PLAN_CONFIGS.starter}
                        currentPlan={currentPlan}
                        restaurantId={restaurantId}
                    />
                    <PlanCard
                        plan="business"
                        config={PLAN_CONFIGS.business}
                        currentPlan={currentPlan}
                        restaurantId={restaurantId}
                        recommended
                    />
                    <PlanCard
                        plan="premium"
                        config={PLAN_CONFIGS.premium}
                        currentPlan={currentPlan}
                        restaurantId={restaurantId}
                    />
                </div>

                {/* FAQ rapide */}
                <div className="bg-white rounded-lg p-8 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 text-center">
                        Questions fréquentes
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">
                                Puis-je changer de plan plus tard ?
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Oui, vous pouvez changer de plan à tout moment. Le changement
                                prendra effet à la fin de votre période en cours.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">
                                Que se passe-t-il si j'annule ?
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Vos données restent sauvegardées pendant 90 jours. Vous pouvez
                                réactiver votre compte à tout moment durant cette période.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">
                                Les prix incluent-ils la TVA ?
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Oui, tous nos prix sont TTC (toutes taxes comprises).
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">
                                Puis-je bénéficier d'une réduction ?
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Oui ! En payant pour 3, 6 ou 12 mois d'avance, vous bénéficiez
                                de réductions allant jusqu'à 20%.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
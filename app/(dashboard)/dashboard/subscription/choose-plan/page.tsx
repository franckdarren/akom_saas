// app/dashboard/subscription/choose-plan/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {getRestaurantSubscription} from '@/lib/actions/subscription'
import {PlanCard} from './PlanCard'
import {getAllPlans} from '@/lib/config/subscription'
import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader} from "@/components/ui/card"

/**
 * Page de sélection du plan d'abonnement
 *
 * Cette page permet à un utilisateur authentifié de :
 * 1. Voir tous les plans disponibles (Starter, Business, Premium)
 * 2. Comparer les fonctionnalités de chaque plan
 * 3. Voir son plan actuel s'il en a un
 * 4. Sélectionner un nouveau plan pour procéder au paiement
 *
 * Seuls les utilisateurs connectés et appartenant à un restaurant
 * peuvent accéder à cette page.
 */
export default async function ChoosePlanPage() {
    // ============================================================
    // ÉTAPE 1 : Vérifier l'authentification
    // ============================================================

    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    // Si l'utilisateur n'est pas connecté, le rediriger vers la page de login
    if (!user) {
        redirect('/login')
    }

    // ============================================================
    // ÉTAPE 2 : Récupérer le restaurant de l'utilisateur
    // ============================================================

    // Chaque utilisateur est lié à un restaurant via la table restaurant_users
    // On récupère cette information pour savoir quel restaurant gérer
    const {data: restaurantUser} = await supabase
        .from('restaurant_users')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .single()

    // Si l'utilisateur n'a pas de restaurant, quelque chose ne va pas
    // On le redirige vers le dashboard principal
    if (!restaurantUser) {
        redirect('/dashboard')
    }

    const restaurantId = restaurantUser.restaurant_id

    // ============================================================
    // ÉTAPE 3 : Récupérer l'abonnement actuel du restaurant
    // ============================================================

    // Cette fonction va chercher l'abonnement actif pour ce restaurant
    // Si le restaurant n'a pas encore d'abonnement, subscription sera null
    const {subscription} = await getRestaurantSubscription(restaurantId)

    // Extraire le plan actuel (peut être undefined si pas d'abonnement)
    // TypeScript sait que currentPlan peut être 'starter' | 'business' | 'premium' | undefined
    const currentPlan = subscription?.plan

    // ============================================================
    // ÉTAPE 4 : Récupérer la liste de tous les plans disponibles
    // ============================================================

    // Cette fonction helper retourne simplement ['starter', 'business', 'premium']
    // C'est plus maintenable que de hardcoder la liste ici
    const plans = getAllPlans()

    // ============================================================
    // RENDU DE LA PAGE
    // ============================================================

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-7xl mx-auto">

                {/* ========================================
          SECTION HEADER
      ======================================== */}
                <div className="text-center mb-12">

                    <Button asChild variant="ghost" className="mb-6">
                        <Link href="/dashboard/subscription">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Retour à l&apos;abonnement
                        </Link>
                    </Button>

                    <h1 className="text-4xl font-bold tracking-tight mb-3">
                        Choisissez votre plan
                    </h1>

                    <p className="text-xl text-muted-foreground">
                        Sélectionnez l&apos;offre qui correspond le mieux à vos besoins
                    </p>
                </div>

                {/* ========================================
          GRILLE DES PLANS
      ======================================== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan}
                            plan={plan}
                            currentPlan={currentPlan}
                            restaurantId={restaurantId}
                            recommended={plan === 'business'}
                        />
                    ))}
                </div>

                {/* ========================================
          SECTION FAQ
      ======================================== */}
                <Card>
                    <CardHeader>
                        <h2 className="text-2xl font-bold text-center">
                            Questions fréquentes
                        </h2>
                    </CardHeader>

                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6 text-sm">

                            {/* Question 1 */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Puis-je changer de plan plus tard ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Oui, vous pouvez changer de plan à tout moment.
                                    Le changement prendra effet à la fin de votre période en cours.
                                </p>
                            </div>

                            {/* Question 2 */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Que se passe-t-il si j'annule ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Vos données restent sauvegardées pendant 90 jours.
                                    Vous pouvez réactiver votre compte à tout moment durant cette période.
                                </p>
                            </div>

                            {/* Question 3 */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Les prix incluent-ils la TVA ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Oui, tous nos prix sont TTC (toutes taxes comprises).
                                </p>
                            </div>

                            {/* Question 4 */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Puis-je bénéficier d'une réduction ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Oui ! En payant pour 3, 6 ou 12 mois d'avance,
                                    vous bénéficiez de réductions allant jusqu'à 20%.
                                </p>
                            </div>

                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )

}
// app/dashboard/subscription/choose-plan/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {getRestaurantSubscription} from '@/lib/actions/subscription'
import {PlanCard} from './PlanCard'
import {getAllPlans} from '@/lib/config/subscription'
import {ArrowLeft} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {Info} from 'lucide-react'

/**
 * Page de sélection du plan d'abonnement avec support de la tarification par utilisateur
 *
 * NOUVELLES FONCTIONNALITÉS :
 * ==========================
 * 1. Récupère le nombre actuel d'utilisateurs du restaurant
 * 2. Passe ce nombre à chaque PlanCard pour une simulation réaliste
 * 3. Affiche des explications claires sur le système de tarification
 * 4. Compare visuellement les plans avec leurs limites d'utilisateurs
 *
 * L'objectif est de rendre la tarification par utilisateur complètement
 * transparente et compréhensible dès cette page, avant même que l'utilisateur
 * ne clique sur un plan spécifique.
 */
export default async function ChoosePlanPage() {
    // ============================================================
    // ÉTAPE 1 : Authentification
    // ============================================================

    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // ============================================================
    // ÉTAPE 2 : Récupérer le Restaurant
    // ============================================================

    const {data: restaurantUser} = await supabase
        .from('restaurant_users')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .single()

    if (!restaurantUser) {
        redirect('/dashboard')
    }

    const restaurantId = restaurantUser.restaurant_id

    // ============================================================
    // ÉTAPE 3 : Récupérer l'Abonnement Actuel
    // ============================================================

    const {subscription} = await getRestaurantSubscription(restaurantId)
    const currentPlan = subscription?.plan

    // ============================================================
    // ÉTAPE 4 : NOUVEAU - Compter les Utilisateurs Actuels
    // ============================================================

    /*
     * Cette étape est nouvelle et cruciale pour le système de tarification
     * par utilisateur. Nous comptons combien d'utilisateurs sont actuellement
     * actifs dans ce restaurant.
     *
     * Ce compte inclut :
     * - L'administrateur (toujours présent)
     * - Tous les utilisateurs ajoutés (cuisiniers, serveurs, etc.)
     *
     * Ce nombre sera utilisé comme valeur par défaut dans les sliders de
     * sélection d'utilisateurs de chaque PlanCard, permettant à l'utilisateur
     * de voir immédiatement le prix pour sa configuration actuelle.
     */
    const {count: currentUserCount} = await supabase
        .from('restaurant_users')
        .select('*', {count: 'exact', head: true})
        .eq('restaurant_id', restaurantId)

    // Garantir qu'on a au moins 1 (l'admin est toujours là)
    const userCount = Math.max(1, currentUserCount || 1)

    // ============================================================
    // ÉTAPE 5 : Récupérer la Liste des Plans
    // ============================================================

    const plans = getAllPlans()

    // ============================================================
    // RENDU DE LA PAGE
    // ============================================================

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ========================================
            HEADER
            ======================================== */}
                <div className="text-center space-y-4">
                    <Button asChild variant="ghost" className="mb-4">
                        <Link href="/dashboard/subscription">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Retour à l'abonnement
                        </Link>
                    </Button>

                    <h1 className="text-4xl font-bold tracking-tight">
                        Choisissez votre plan
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Sélectionnez l'offre qui correspond à vos besoins.
                        Ajustez le nombre d'utilisateurs pour voir le prix en temps réel.
                    </p>
                </div>

                {/* ========================================
            ALERTE INFORMATIVE SUR LA TARIFICATION
            ======================================== */}
                <Alert className="max-w-3xl mx-auto border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600"/>
                    <AlertDescription className="text-sm text-blue-900">
                        <strong>💡 Comment fonctionne notre tarification :</strong> Chaque plan
                        a un prix de base qui inclut uniquement l'administrateur. Chaque
                        utilisateur supplémentaire (cuisinier, serveur, etc.) coûte un montant
                        additionnel par mois. Vous ne payez que pour ce que vous utilisez vraiment !
                        <br/>
                        <span className="text-xs mt-1 block text-blue-700">
              Vous avez actuellement <strong>{userCount} utilisateur
                            {userCount > 1 ? 's' : ''}</strong> dans votre restaurant.
            </span>
                    </AlertDescription>
                </Alert>

                {/* ========================================
            GRILLE DES PLANS
            ======================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-15">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan}
                            plan={plan}
                            currentPlan={currentPlan}
                            currentUserCount={userCount}
                            restaurantId={restaurantId}
                            recommended={plan === 'business'}
                        />
                    ))}
                </div>

                {/* ========================================
            TABLEAU COMPARATIF DES LIMITES
            ======================================== */}
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-center">
                            Comparaison des limites par plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-semibold">
                                        Caractéristique
                                    </th>
                                    <th className="text-center py-3 px-4 font-semibold">
                                        Starter
                                    </th>
                                    <th className="text-center py-3 px-4 font-semibold bg-primary/5">
                                        Business
                                    </th>
                                    <th className="text-center py-3 px-4 font-semibold">
                                        Premium
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y">
                                <tr>
                                    <td className="py-3 px-4">Prix de base</td>
                                    <td className="text-center py-3 px-4">3 000 FCFA/mois</td>
                                    <td className="text-center py-3 px-4 bg-primary/5">
                                        5 000 FCFA/mois
                                    </td>
                                    <td className="text-center py-3 px-4">8 000 FCFA/mois</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Utilisateurs max</td>
                                    <td className="text-center py-3 px-4">3</td>
                                    <td className="text-center py-3 px-4 bg-primary/5">5</td>
                                    <td className="text-center py-3 px-4">
                                        <span className="text-primary font-semibold">Illimité</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Coût par user supplémentaire</td>
                                    <td className="text-center py-3 px-4">5 000 FCFA/mois</td>
                                    <td className="text-center py-3 px-4 bg-primary/5">
                                        7 500 FCFA/mois
                                    </td>
                                    <td className="text-center py-3 px-4">10 000 FCFA/mois</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Tables</td>
                                    <td className="text-center py-3 px-4">10</td>
                                    <td className="text-center py-3 px-4 bg-primary/5">20</td>
                                    <td className="text-center py-3 px-4">
                                        <span className="text-primary font-semibold">Illimité</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Produits</td>
                                    <td className="text-center py-3 px-4">50</td>
                                    <td className="text-center py-3 px-4 bg-primary/5">200</td>
                                    <td className="text-center py-3 px-4">
                                        <span className="text-primary font-semibold">Illimité</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Module caisse</td>
                                    <td className="text-center py-3 px-4">❌</td>
                                    <td className="text-center py-3 px-4 bg-primary/5">✅</td>
                                    <td className="text-center py-3 px-4">✅</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Module entrepôt</td>
                                    <td className="text-center py-3 px-4">❌</td>
                                    <td className="text-center py-3 px-4 bg-primary/5">✅</td>
                                    <td className="text-center py-3 px-4">✅</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Mobile Money</td>
                                    <td className="text-center py-3 px-4">❌</td>
                                    <td className="text-center py-3 px-4 bg-primary/5">❌</td>
                                    <td className="text-center py-3 px-4">✅</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* ========================================
            SECTION FAQ
            ======================================== */}
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">
                            Questions fréquentes
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6 text-sm">

                            {/* Question 1 - Nouvelle question sur les utilisateurs */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Comment sont comptés les utilisateurs ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Chaque compte créé dans votre restaurant compte comme un
                                    utilisateur : l'administrateur, les cuisiniers, les serveurs, etc.
                                    L'admin est toujours inclus dans le prix de base.
                                </p>
                            </div>

                            {/* Question 2 - Nouvelle question sur les limites */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Que se passe-t-il si j'atteins ma limite d'utilisateurs ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Sur les plans Starter et Business, vous devrez passer au plan
                                    supérieur pour ajouter plus d'utilisateurs. Sur Premium, il n'y a
                                    aucune limite.
                                </p>
                            </div>

                            {/* Question 3 */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Puis-je changer de plan plus tard ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Oui, vous pouvez changer de plan à tout moment. Le changement
                                    prendra effet à la fin de votre période en cours.
                                </p>
                            </div>

                            {/* Question 4 */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Les prix incluent-ils la TVA ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Oui, tous nos prix sont TTC (toutes taxes comprises).
                                </p>
                            </div>

                            {/* Question 5 */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Puis-je bénéficier d'une réduction ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Oui ! En payant pour 3, 6 ou 12 mois d'avance, vous bénéficiez
                                    de réductions allant jusqu'à 20%.
                                </p>
                            </div>

                            {/* Question 6 - Nouvelle question */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Le prix change-t-il si je supprime un utilisateur ?
                                </h3>
                                <p className="text-muted-foreground">
                                    Oui, votre facturation mensuelle sera ajustée à la baisse lors
                                    du prochain renouvellement si vous avez moins d'utilisateurs.
                                </p>
                            </div>

                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
// app/dashboard/subscription/payment/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import {getRestaurantSubscription} from '@/lib/actions/subscription'
import {PaymentForm} from './PaymentForm'
import {ArrowLeft, AlertCircle} from 'lucide-react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {
    SUBSCRIPTION_CONFIG,
    calculatePrice,
    formatPrice,
    type SubscriptionPlan,
    type BillingCycle,
} from '@/lib/config/subscription'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"

// ============================================================
// TYPES ET INTERFACES
// ============================================================

/**
 * Structure des paramètres de recherche attendus dans l'URL
 *
 * Cette interface définit ce que nous attendons de recevoir depuis
 * l'URL de la page, par exemple :
 * /dashboard/subscription/payment?plan=business&cycle=3&restaurantId=xxx
 *
 * Notez que tous les champs sont optionnels car l'utilisateur pourrait
 * arriver sur cette page sans tous les paramètres (par exemple en tapant
 * l'URL directement). Nous devons donc gérer ces cas avec des valeurs
 * par défaut sécurisées.
 */
interface SearchParams {
    plan?: string
    cycle?: string
    restaurantId?: string
}

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Convertit une valeur de cycle en BillingCycle valide et typé
 *
 * Cette fonction est un exemple de "defensive programming" (programmation
 * défensive). Nous ne faisons jamais confiance aux données qui viennent
 * de l'extérieur (ici, l'URL). Un utilisateur malveillant pourrait modifier
 * l'URL pour mettre cycle=999 ou cycle=hack, ce qui casserait notre application
 * si nous ne validions pas la valeur.
 *
 * La fonction vérifie que la valeur est bien dans la liste autorisée
 * [1, 3, 6, 12]. Si ce n'est pas le cas, elle retourne 1 (un mois) comme
 * valeur par défaut sécurisée. C'est comme un garde qui vérifie votre
 * billet avant de vous laisser entrer : si le billet n'est pas valide,
 * vous n'entrez pas.
 *
 * @param value - La valeur string provenant de l'URL
 * @returns Un BillingCycle valide (1, 3, 6 ou 12)
 */
function parseBillingCycle(value: string | undefined): BillingCycle {
    const allowed: BillingCycle[] = [1, 3, 6, 12]
    const parsed = Number(value)

    // Vérifier si la valeur convertie en nombre fait partie des cycles autorisés
    return allowed.includes(parsed as BillingCycle)
        ? (parsed as BillingCycle)
        : 1 // Valeur par défaut sécurisée
}

/**
 * Retourne le label de réduction selon le cycle choisi
 *
 * Cette fonction aide à afficher un message clair à l'utilisateur sur
 * la réduction qu'il obtient. Elle retourne `null` si aucune réduction
 * n'est applicable (cycle = 1 mois), ce qui permet dans le JSX de faire
 * une condition simple comme `{discountLabel && <div>...</div>}` sans
 * risquer d'afficher "false" à l'écran.
 *
 * Pourquoi retourner null plutôt que une string vide "" ?
 * - null est sémantiquement plus correct (absence de valeur)
 * - En JSX, null ne rend rien, alors que "" pourrait créer des espaces vides
 * - Cela rend le code plus lisible : on voit clairement qu'il n'y a pas de réduction
 *
 * @param cycle - Le cycle de facturation choisi
 * @returns Le pourcentage de réduction sous forme de string, ou null
 */
function getDiscountLabel(cycle: BillingCycle): string | null {
    const labels: Partial<Record<BillingCycle, string>> = {
        3: '10%',
        6: '15%',
        12: '20%',
    }
    return labels[cycle] ?? null
}

// ============================================================
// COMPOSANT PAGE
// ============================================================

/**
 * Page de paiement pour l'abonnement
 *
 * Cette page Server Component (SSR) gère tout le processus de paiement :
 * 1. Vérifie l'authentification de l'utilisateur
 * 2. Récupère les informations du restaurant
 * 3. Valide les paramètres de l'URL (plan et cycle)
 * 4. Calcule le montant à payer avec les réductions
 * 5. Affiche le récapitulatif et les instructions de paiement
 * 6. Rend le formulaire pour soumettre la preuve de paiement
 *
 * Sécurité importante : Nous ignorons volontairement le `restaurantId`
 * des searchParams et le récupérons depuis la base de données en fonction
 * de l'utilisateur connecté. Cela empêche un utilisateur malveillant de
 * payer pour un autre restaurant en modifiant l'URL.
 */
export default async function PaymentPage({
                                              searchParams,
                                          }: {
    searchParams: Promise<SearchParams>
}) {
    // ============================================================
    // ÉTAPE 1 : Récupération et Validation des Paramètres
    // ============================================================

    /*
     * Next.js 15+ a rendu searchParams asynchrone pour améliorer les
     * performances de streaming. Nous devons donc l'attendre avant de
     * pouvoir accéder à ses propriétés.
     *
     * Pourquoi ce changement ? Imaginez une page web complexe : au lieu
     * d'attendre que TOUTES les données soient chargées avant d'afficher
     * quoi que ce soit, Next.js peut maintenant commencer à rendre des
     * parties de la page immédiatement, pendant que d'autres données
     * continuent de se charger en arrière-plan. C'est comme recevoir
     * les entrées pendant que le plat principal se prépare en cuisine.
     */
    const params = await searchParams

    // ============================================================
    // ÉTAPE 2 : Authentification
    // ============================================================

    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    // Rediriger vers la page de connexion si non authentifié
    if (!user) {
        redirect('/login')
    }

    // ============================================================
    // ÉTAPE 3 : Récupération du Restaurant de l'Utilisateur
    // ============================================================

    /*
     * SÉCURITÉ CRITIQUE : Nous récupérons le restaurant depuis la base
     * de données en fonction de l'utilisateur connecté, PAS depuis l'URL.
     *
     * Pourquoi ? Un utilisateur malveillant pourrait modifier l'URL pour
     * mettre restaurantId=autre-restaurant et ainsi payer pour quelqu'un
     * d'autre (ce qui pourrait causer des problèmes comptables ou légaux).
     *
     * En récupérant le restaurant depuis la session authentifiée, nous
     * garantissons que l'utilisateur ne peut payer QUE pour son propre
     * restaurant. C'est comme vérifier votre carte d'identité avant de
     * vous laisser payer la facture : on s'assure que vous êtes bien la
     * personne autorisée.
     */
    const {data: restaurantUser} = await supabase
        .from('restaurant_users')
        .select('restaurant_id, restaurants(name)')
        .eq('user_id', user.id)
        .single()

    if (!restaurantUser) {
        redirect('/dashboard')
    }

    const restaurantId = restaurantUser.restaurant_id
    const restaurantName = (restaurantUser.restaurants as any)?.name

    // ============================================================
    // ÉTAPE 4 : Extraction et Validation des Paramètres du Plan
    // ============================================================

    /*
     * Nous extrayons le plan et le cycle depuis les paramètres de l'URL.
     * Si ces paramètres sont absents ou invalides, nous utilisons des
     * valeurs par défaut sécurisées :
     * - plan par défaut : 'starter' (le moins cher, le plus sûr)
     * - cycle par défaut : 1 (géré par parseBillingCycle)
     */
    const plan = (params.plan as SubscriptionPlan) || 'starter'
    const billingCycle = parseBillingCycle(params.cycle)

    /*
     * Validation supplémentaire : vérifier que le plan fait bien partie
     * des plans existants. Si quelqu'un met plan=hacker dans l'URL, nous
     * le redirigeons vers la page de choix de plan.
     *
     * C'est une double vérification : TypeScript nous protège à la compilation,
     * mais cette vérification runtime nous protège contre les manipulations
     * d'URL directes.
     */
    if (!['starter', 'business', 'premium'].includes(plan)) {
        redirect('/dashboard/subscription/choose-plan')
    }

    // ============================================================
    // ÉTAPE 5 : Récupération de la Configuration et Calculs
    // ============================================================

    // Récupérer la configuration complète de ce plan
    const planConfig = SUBSCRIPTION_CONFIG[plan]

    // Calculer le montant total avec réductions éventuelles
    const amount = calculatePrice(plan, billingCycle)

    // Obtenir le label de réduction pour l'affichage
    const discountLabel = getDiscountLabel(billingCycle)

    // Récupérer l'abonnement actuel (pour contexte/debug si nécessaire)
    const {subscription} = await getRestaurantSubscription(restaurantId)

    // ============================================================
    // RENDU DE LA PAGE
    // ============================================================

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* HEADER */}
                <div>
                    <Button asChild variant="ghost" className="mb-4">
                        <Link href="/dashboard/subscription/choose-plan">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Retour au choix du plan
                        </Link>
                    </Button>

                    <h1 className="text-3xl font-bold tracking-tight">
                        Paiement de l'abonnement
                    </h1>

                    <p className="text-muted-foreground mt-1">
                        {restaurantName}
                    </p>
                </div>

                {/* GRID */}
                <div className="grid md:grid-cols-2 gap-8">

                    {/* ================= LEFT COLUMN ================= */}
                    <div className="space-y-6">

                        {/* RÉCAPITULATIF */}
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h2 className="text-xl font-semibold">
                                    Récapitulatif de la commande
                                </h2>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Plan</span>
                                        <span className="font-medium capitalize">
                    {planConfig.name}
                  </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Durée</span>
                                        <span className="font-medium">
                    {billingCycle} mois
                  </span>
                                    </div>

                                    <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Prix mensuel
                  </span>
                                        <span className="font-medium">
                    {formatPrice(planConfig.monthlyPrice)}
                  </span>
                                    </div>

                                    {discountLabel && (
                                        <div className="flex justify-between text-primary">
                                            <span>Réduction</span>
                                            <span className="font-medium">
                      -{discountLabel}
                    </span>
                                        </div>
                                    )}

                                    <div className="border-t pt-3">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total à payer</span>
                                            <span>{formatPrice(amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* INFORMATIONS DE PAIEMENT */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Informations de paiement
                                </CardTitle>
                                <CardDescription>
                                    Effectuez votre paiement via Mobile Money ou virement bancaire.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6 text-sm">

                                {/* Mobile Money */}
                                <div>
                                    <p className="font-medium mb-2">Mobile Money</p>
                                    <div className="bg-muted rounded-lg p-4 space-y-1">
                                        <p><strong>Airtel Money :</strong> +241 XX XX XX XX</p>
                                        <p><strong>Moov Money :</strong> +241 XX XX XX XX</p>
                                        <p className="text-muted-foreground text-xs mt-2">
                                            Nom du compte : AKOM SAAS
                                        </p>
                                    </div>
                                </div>

                                {/* Virement */}
                                <div>
                                    <p className="font-medium mb-2">Virement bancaire</p>
                                    <div className="bg-muted rounded-lg p-4 space-y-1">
                                        <p><strong>Banque :</strong> BGFI Bank</p>
                                        <p><strong>IBAN :</strong> GA21 XXXX XXXX XXXX XXXX XXXX</p>
                                        <p><strong>Titulaire :</strong> AKOM SAAS</p>
                                    </div>
                                </div>

                                <Alert variant="default">
                                    <AlertCircle className="h-4 w-4"/>
                                    <AlertTitle>Important</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        Indiquez votre <strong>nom de restaurant</strong> dans
                                        le libellé du virement pour faciliter la validation.
                                    </AlertDescription>
                                </Alert>

                            </CardContent>
                        </Card>

                        {/* COMMENT ÇA MARCHE */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Comment ça marche ?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-3 text-sm text-muted-foreground">
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-foreground">1.</span>
                                        Effectuez le paiement via Mobile Money ou virement bancaire
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-foreground">2.</span>
                                        Prenez une capture d'écran de la confirmation de paiement
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-foreground">3.</span>
                                        Uploadez la preuve via le formulaire ci-contre
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-foreground">4.</span>
                                        Notre équipe valide votre paiement sous 24h
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-foreground">5.</span>
                                        Votre abonnement est activé automatiquement
                                    </li>
                                </ol>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ================= RIGHT COLUMN ================= */}
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
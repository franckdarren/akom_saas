// components/guards/FeatureGuard.tsx

import {redirect} from "next/navigation"
import {ReactNode} from "react"
import {hasFeature} from "@/lib/services/subscription-checker"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {Button} from "@/components/ui/button"
import {Lock, TrendingUp} from "lucide-react"
import Link from "next/link"
import type {FeatureKey} from "@/lib/config/subscription"
import {
    SUBSCRIPTION_CONFIG,
    FEATURE_LABELS,
} from "@/lib/config/subscription"

interface FeatureGuardProps {
    restaurantId: string
    requiredFeature: FeatureKey
    children: ReactNode
    showError?: boolean
    redirectTo?: string
}

export async function FeatureGuard({
                                       restaurantId,
                                       requiredFeature,
                                       children,
                                       showError = false,
                                       redirectTo = "/dashboard/subscription/choose-plan",
                                   }: FeatureGuardProps): Promise<ReactNode> {

    // Vérifier si la feature est autorisée
    const isAllowed = await hasFeature(restaurantId, requiredFeature)

    // ✅ Si autorisé → afficher normalement
    if (isAllowed) {
        return <>{children}</>
    }

    // ✅ Si on veut afficher une erreur au lieu de rediriger
    if (showError) {
        const featureName =
            FEATURE_LABELS[requiredFeature] ?? requiredFeature

        let requiredPlan: string | null = null

        // 🔐 Correction TS7053 ici (sans toucher subscription.ts)
        for (const [planName, config] of Object.entries(SUBSCRIPTION_CONFIG)) {
            const features = config.features as Record<string, boolean>

            if (
                requiredFeature in features &&
                features[requiredFeature] === true
            ) {
                requiredPlan = planName
                break
            }
        }

        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-6">
                    <Alert variant="destructive">
                        <Lock className="h-5 w-5"/>
                        <AlertTitle className="text-lg font-semibold">
                            Fonctionnalité non disponible
                        </AlertTitle>

                        <AlertDescription className="space-y-4 mt-3">
                            <p>
                                <strong>{featureName}</strong> n'est pas inclus
                                dans votre plan actuel.
                            </p>

                            {requiredPlan && (
                                <p className="text-sm">
                                    Disponible à partir du plan{" "}
                                    <span className="font-semibold capitalize">
                                        {requiredPlan}
                                    </span>.
                                </p>
                            )}

                            <Button asChild className="w-full mt-4">
                                <Link href={redirectTo}>
                                    <TrendingUp className="mr-2 h-4 w-4"/>
                                    Voir les plans disponibles
                                </Link>
                            </Button>
                        </AlertDescription>
                    </Alert>

                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard">
                            Retour au tableau de bord
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    // ✅ Redirection serveur propre
    return redirect(redirectTo)
}
// lib/hooks/use-subscription-features.ts
'use client'

import {useMemo} from 'react'
import {SUBSCRIPTION_CONFIG, type FeatureKey} from '@/lib/config/subscription'
import type {SubscriptionPlan} from '@/lib/config/subscription'

/**
 * Hook pour vérifier les features disponibles selon le plan d'abonnement
 *
 * Ce hook permet à n'importe quel composant de vérifier si une feature
 * spécifique est disponible dans le plan actuel de l'utilisateur.
 *
 * UTILISATION :
 * =============
 * const { hasFeature, plan } = useSubscriptionFeatures('business')
 * const canUseStock = hasFeature('stock_management')
 * const canUseMobileMoney = hasFeature('mobile_payment')
 */

interface UseSubscriptionFeaturesReturn {
    plan: SubscriptionPlan
    planName: string
    hasFeature: (feature: FeatureKey) => boolean
    isFeatureLocked: (feature: FeatureKey) => boolean
    getRequiredPlan: (feature: FeatureKey) => SubscriptionPlan | null
}

export function useSubscriptionFeatures(
    currentPlan: SubscriptionPlan
): UseSubscriptionFeaturesReturn {

    // Mémoiser les fonctions pour éviter les re-renders inutiles
    const features = useMemo(() => {
        const config = SUBSCRIPTION_CONFIG[currentPlan]

        return {
            plan: currentPlan,
            planName: config.name,

            /**
             * Vérifie si une feature est disponible dans le plan actuel
             */
            hasFeature: (feature: FeatureKey): boolean => {
                const featureValue = config.features[feature as keyof typeof config.features]

                // Si c'est un booléen, retourner directement
                if (typeof featureValue === 'boolean') {
                    return featureValue
                }

                // Si c'est autre chose (limite numérique), considérer comme disponible
                return true
            },

            /**
             * Vérifie si une feature est verrouillée (inverse de hasFeature)
             */
            isFeatureLocked: (feature: FeatureKey): boolean => {
                const featureValue = config.features[feature as keyof typeof config.features]

                if (typeof featureValue === 'boolean') {
                    return !featureValue
                }

                return false
            },

            /**
             * Retourne le plan minimum requis pour une feature donnée
             * Utile pour afficher "Disponible à partir de Business"
             */
            getRequiredPlan: (feature: FeatureKey): SubscriptionPlan | null => {
                // Vérifier dans l'ordre : starter -> business -> premium
                const plans: SubscriptionPlan[] = ['starter', 'business', 'premium']

                for (const plan of plans) {
                    const planConfig = SUBSCRIPTION_CONFIG[plan]
                    const featureValue = planConfig.features[feature as keyof typeof planConfig.features]

                    if (typeof featureValue === 'boolean' && featureValue) {
                        return plan
                    }
                }

                return null
            },
        }
    }, [currentPlan])

    return features
}
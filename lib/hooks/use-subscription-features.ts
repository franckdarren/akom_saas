// lib/hooks/use-subscription-features.ts
'use client'

import {useMemo} from 'react'
import {SUBSCRIPTION_CONFIG, type FeatureKey} from '@/lib/config/subscription'
import type {SubscriptionPlan} from '@/lib/config/subscription'

interface UseSubscriptionFeaturesReturn {
    plan: SubscriptionPlan | null
    planName: string | null
    hasFeature: (feature: FeatureKey) => boolean
    isFeatureLocked: (feature: FeatureKey) => boolean
    getRequiredPlan: (feature: FeatureKey) => SubscriptionPlan | null
}

export function useSubscriptionFeatures(
    currentPlan?: SubscriptionPlan
): UseSubscriptionFeaturesReturn {

    const features = useMemo(() => {

        // ============================================================
        // 🔐 CAS SUPERADMIN (aucun plan)
        // ============================================================

        if (!currentPlan) {
            return {
                plan: null,
                planName: 'Superadmin',

                hasFeature: () => true,          // accès total
                isFeatureLocked: () => false,    // rien n’est verrouillé
                getRequiredPlan: () => null,     // pas pertinent
            }
        }

        const config = SUBSCRIPTION_CONFIG[currentPlan]

        // Sécurité supplémentaire (évite crash si plan invalide)
        if (!config) {
            return {
                plan: null,
                planName: null,
                hasFeature: () => false,
                isFeatureLocked: () => true,
                getRequiredPlan: () => null,
            }
        }

        // ============================================================
        // 👤 CAS UTILISATEUR NORMAL
        // ============================================================

        return {
            plan: currentPlan,
            planName: config.name,

            hasFeature: (feature: FeatureKey): boolean => {
                const featureValue =
                    config.features[feature as keyof typeof config.features]

                if (typeof featureValue === 'boolean') {
                    return featureValue
                }

                // Valeur numérique (ex: max_tables) => disponible
                return true
            },

            isFeatureLocked: (feature: FeatureKey): boolean => {
                const featureValue =
                    config.features[feature as keyof typeof config.features]

                if (typeof featureValue === 'boolean') {
                    return !featureValue
                }

                return false
            },

            getRequiredPlan: (feature: FeatureKey): SubscriptionPlan | null => {
                const plans: SubscriptionPlan[] = ['starter', 'business', 'premium']

                for (const plan of plans) {
                    const planConfig = SUBSCRIPTION_CONFIG[plan]
                    const featureValue =
                        planConfig.features[
                            feature as keyof typeof planConfig.features
                            ]

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
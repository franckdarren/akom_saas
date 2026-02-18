// components/subscription/FeatureGate.tsx
'use client'

import {ReactNode} from 'react'
import {useRestaurant} from '@/lib/hooks/use-restaurant'
import {PLAN_FEATURES, FEATURE_LABELS, type FeatureKey} from '@/lib/config/subscription-features'
import {Button} from '@/components/ui/button'
import {Lock} from 'lucide-react'
import Link from 'next/link'

interface FeatureGateProps {
    feature: FeatureKey
    children: ReactNode
    fallback?: ReactNode
    showUpgradePrompt?: boolean
}

/**
 * Composant qui masque ou désactive des fonctionnalités
 * selon l'offre d'abonnement
 *
 * Utilisation :
 * <FeatureGate feature="advanced_stats">
 *   <AdvancedStatsComponent />
 * </FeatureGate>
 */
export function FeatureGate({
                                feature,
                                children,
                                fallback,
                                showUpgradePrompt = true,
                            }: FeatureGateProps) {
    const {currentPlan} = useRestaurant()

    if (!currentPlan) {
        return null
    }

    const planFeatures = PLAN_FEATURES[currentPlan]
    const featureValue = planFeatures[feature]

    // Si c'est un booléen, vérifier directement
    const hasAccess = typeof featureValue === 'boolean'
        ? featureValue
        : true // Si c'est un nombre/unlimited, considérer comme accessible

    if (hasAccess) {
        return <>{children}</>
    }

    // Afficher le fallback personnalisé
    if (fallback) {
        return <>{fallback}</>
    }

    // Afficher le prompt de mise à niveau par défaut
    if (showUpgradePrompt) {
        return (
            <div
                className="bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-full">
                        <Lock className="h-6 w-6 text-zinc-600 dark:text-zinc-400"/>
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Fonctionnalité Premium
                </h3>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    {FEATURE_LABELS[feature]} est disponible à partir de l'offre Business.
                </p>

                <Button asChild>
                    <Link href="/dashboard/subscription">
                        Voir les offres
                    </Link>
                </Button>
            </div>
        )
    }

    // Ne rien afficher
    return null
}
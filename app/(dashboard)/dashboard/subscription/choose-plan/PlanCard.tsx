// app/dashboard/subscription/choose-plan/PlanCard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import {
    formatPrice,
    calculatePrice,
    calculateSavings,
    type SubscriptionPlan,
    type BillingCycle,
    type PlanConfig,
} from '@/lib/subscription/config'

interface PlanCardProps {
    plan: SubscriptionPlan
    config: PlanConfig
    currentPlan?: SubscriptionPlan
    restaurantId: string
    recommended?: boolean
}

export function PlanCard({
    plan,
    config,
    currentPlan,
    restaurantId,
    recommended,
}: PlanCardProps) {
    const router = useRouter()
    const [billingCycle, setBillingCycle] = useState<BillingCycle>(1)
    const [loading, setLoading] = useState(false)

    const price = calculatePrice(plan, billingCycle)
    const savings = calculateSavings(plan, billingCycle)
    const isCurrent = currentPlan === plan

    const handleSelectPlan = () => {
        setLoading(true)
        // Rediriger vers la page de paiement avec les params
        router.push(
            `/dashboard/subscription/payment?plan=${plan}&cycle=${billingCycle}&restaurantId=${restaurantId}`
        )
    }

    return (
        <Card
            className={`relative ${recommended ? 'border-blue-500 border-2 shadow-lg' : ''
                } ${isCurrent ? 'bg-gray-50' : ''}`}
        >
            {recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500">Recommandé</Badge>
                </div>
            )}
            {isCurrent && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">Plan actuel</Badge>
                </div>
            )}

            <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl capitalize">{config.name}</CardTitle>
                <CardDescription>{config.description}</CardDescription>

                <div className="mt-6">
                    <div className="text-4xl font-bold">
                        {formatPrice(price)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        pour {billingCycle} mois
                    </p>
                    {savings > 0 && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                            Économisez {formatPrice(savings)}
                        </p>
                    )}
                </div>

                {/* Sélecteur de durée */}
                <div className="mt-6">
                    <Select
                        value={billingCycle.toString()}
                        onValueChange={(value) => setBillingCycle(Number(value) as BillingCycle)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 mois</SelectItem>
                            <SelectItem value="3">3 mois (-10%)</SelectItem>
                            <SelectItem value="6">6 mois (-15%)</SelectItem>
                            <SelectItem value="12">12 mois (-20%)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                    {config.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <Button
                    onClick={handleSelectPlan}
                    disabled={loading || isCurrent}
                    className="w-full"
                    size="lg"
                    variant={recommended ? 'default' : 'outline'}
                >
                    {loading
                        ? 'Chargement...'
                        : isCurrent
                            ? 'Plan actuel'
                            : 'Choisir ce plan'}
                </Button>
            </CardContent>
        </Card>
    )
}
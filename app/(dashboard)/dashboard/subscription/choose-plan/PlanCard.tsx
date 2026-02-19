'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {Badge} from '@/components/ui/badge'
import {Check} from 'lucide-react'
import {
    SUBSCRIPTION_CONFIG,
    formatPrice,
    calculatePrice,
    calculateSavings,
    type SubscriptionPlan,
    type BillingCycle,
} from '@/lib/config/subscription'
import {cn} from '@/lib/utils'

interface PlanCardProps {
    plan: SubscriptionPlan
    currentPlan?: SubscriptionPlan
    restaurantId: string
    recommended?: boolean
}

export function PlanCard({
                             plan,
                             currentPlan,
                             restaurantId,
                             recommended,
                         }: PlanCardProps) {
    const router = useRouter()

    const [billingCycle, setBillingCycle] = useState<BillingCycle>(1)
    const [loading, setLoading] = useState(false)

    const config = SUBSCRIPTION_CONFIG[plan]
    const price = calculatePrice(plan, billingCycle)
    const savings = calculateSavings(plan, billingCycle)

    const isCurrent = currentPlan === plan

    const handleSelectPlan = () => {
        setLoading(true)
        router.push(
            `/dashboard/subscription/payment?plan=${plan}&cycle=${billingCycle}&restaurantId=${restaurantId}`
        )
    }

    return (
        <Card
            className={cn(
                'relative transition-all',
                recommended && 'border-primary shadow-lg',
                isCurrent && 'bg-muted'
            )}
        >
            {/* Badge supérieur */}
            {(recommended || isCurrent) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant={recommended ? 'default' : 'secondary'}>
                        {recommended ? 'Recommandé' : 'Plan actuel'}
                    </Badge>
                </div>
            )}

            <CardHeader className="text-center space-y-4 pt-8">
                <CardTitle className="text-2xl capitalize">
                    {config.name}
                </CardTitle>

                <CardDescription>
                    {config.tagline}
                </CardDescription>

                <div className="space-y-1">
                    <div className="text-4xl font-bold tracking-tight">
                        {formatPrice(price)}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        pour {billingCycle} mois
                    </p>

                    {savings > 0 && (
                        <p className="text-sm font-medium text-primary">
                            Économisez {formatPrice(savings)}
                        </p>
                    )}
                </div>

                <Select
                    value={billingCycle.toString()}
                    onValueChange={(value) =>
                        setBillingCycle(Number(value) as BillingCycle)
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1 mois</SelectItem>
                        <SelectItem value="3">3 mois (-10%)</SelectItem>
                        <SelectItem value="6">6 mois (-15%)</SelectItem>
                        <SelectItem value="12">12 mois (-20%)</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="space-y-3">
                    {config.marketingFeatures.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5"/>
                            <span className="text-sm text-foreground">
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>

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
                            : config.cta || 'Choisir ce plan'}
                </Button>
            </CardContent>
        </Card>
    )
}

'use client'

import {useRouter} from 'next/navigation'
import {useNavigationLoading} from '@/lib/hooks/use-navigation-loading'
import {Button} from '@/components/ui/button'
import {Loader2, ArrowRight} from 'lucide-react'
import type {SubscriptionPlan, BillingCycle} from '@/lib/config/subscription'

interface RenewButtonProps {
    plan: SubscriptionPlan
    billingCycle: BillingCycle
    userCount: number
    restaurantId: string
}

export function RenewButton({plan, billingCycle, userCount, restaurantId}: RenewButtonProps) {
    const router = useRouter()
    const {loading, startLoading} = useNavigationLoading()

    const handleRenew = () => {
        startLoading()
        router.push(
            `/dashboard/subscription/payment?plan=${plan}&cycle=${billingCycle}&users=${userCount}&restaurantId=${restaurantId}&mode=renew`
        )
    }

    return (
        <Button
            onClick={handleRenew}
            disabled={loading}
            variant="outline"
            className="w-full sm:flex-1"
            size="lg"
        >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Renouveler maintenant
        </Button>
    )
}

interface ChangePlanButtonProps {
    label: string
}

export function ChangePlanButton({label}: ChangePlanButtonProps) {
    const router = useRouter()
    const {loading, startLoading} = useNavigationLoading()

    const handleChange = () => {
        startLoading()
        router.push('/dashboard/subscription/choose-plan')
    }

    return (
        <Button
            onClick={handleChange}
            disabled={loading}
            className="w-full sm:flex-1"
            size="lg"
        >
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
            ) : ""}
            {label}
        </Button>
    )
}

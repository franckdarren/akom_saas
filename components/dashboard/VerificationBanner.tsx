// components/dashboard/VerificationBanner.tsx
'use client'

import { AlertCircle, Clock, XCircle, FileCheck } from 'lucide-react'
import { AlertBanner } from '@/components/ui/alert-banner'
import type { AlertBannerProps } from '@/components/ui/alert-banner'

interface VerificationBannerProps {
    restaurantId: string
    status: string
    isFirstRestaurant?: boolean
}

type BannerConfig = {
    variant: AlertBannerProps['variant']
    icon: AlertBannerProps['icon']
    title: string
    message: string
    cta: string | null
}

const BANNER_CONFIG: Record<string, BannerConfig> = {
    pending_documents: {
        variant: 'warning',
        icon: AlertCircle,
        title: 'Documents requis',
        message: "Cette structure nécessite une vérification d'identité pour être activée.",
        cta: 'Soumettre les documents',
    },
    documents_submitted: {
        variant: 'info',
        icon: Clock,
        title: 'Vérification en cours',
        message: 'Vos documents ont été soumis. Notre équipe les examine sous 24–48h.',
        cta: null,
    },
    documents_rejected: {
        variant: 'destructive',
        icon: XCircle,
        title: 'Documents rejetés',
        message: "Vos documents n'ont pas été acceptés. Veuillez en soumettre de nouveaux.",
        cta: 'Re-soumettre les documents',
    },
}

export function VerificationBanner({ restaurantId, status }: VerificationBannerProps) {
    const config = BANNER_CONFIG[status]
    if (!config) return null

    const verifyHref = `/dashboard/restaurants/${restaurantId}/verify`

    return (
        <AlertBanner
            variant={config.variant}
            icon={config.icon}
            title={config.title}
            action={
                config.cta
                    ? { label: config.cta, icon: FileCheck, href: verifyHref }
                    : undefined
            }
        >
            {config.message}
        </AlertBanner>
    )
}

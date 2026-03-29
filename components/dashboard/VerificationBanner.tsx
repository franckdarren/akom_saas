// components/dashboard/VerificationBanner.tsx
'use client'

import Link from 'next/link'
import {AlertCircle, Clock, XCircle, FileCheck} from 'lucide-react'
import {cn} from '@/lib/utils'

interface VerificationBannerProps {
    restaurantId: string
    status: string
    isFirstRestaurant: boolean
}

const BANNER_CONFIG = {
    pending_documents: {
        icon: AlertCircle,
        color: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200',
        iconCls: 'text-amber-500',
        title: 'Documents requis',
        message: 'Cette structure nécessite une vérification d\'identité pour être activée.',
        cta: 'Soumettre les documents',
    },
    documents_submitted: {
        icon: Clock,
        color: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200',
        iconCls: 'text-blue-500',
        title: 'Vérification en cours',
        message: 'Vos documents ont été soumis. Notre équipe les examine sous 24–48h.',
        cta: null,
    },
    documents_rejected: {
        icon: XCircle,
        color: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200',
        iconCls: 'text-red-500',
        title: 'Documents rejetés',
        message: 'Vos documents n\'ont pas été acceptés. Veuillez en soumettre de nouveaux.',
        cta: 'Re-soumettre les documents',
    },
}

export function VerificationBanner({restaurantId, status, isFirstRestaurant}: VerificationBannerProps) {
    const config = BANNER_CONFIG[status as keyof typeof BANNER_CONFIG]
    if (!config) return null

    const Icon = config.icon
    const verifyHref = `/dashboard/restaurants/${restaurantId}/verify`

    return (
        <div className={cn(
            'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b px-4 py-3 text-sm',
            config.color
        )}>
            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <Icon className={cn('h-4 w-4 shrink-0 mt-0.5 sm:mt-0', config.iconCls)}/>
                <p className="flex-1 min-w-0">
                    <span className="font-semibold">{config.title}. </span>
                    <span className="opacity-80">{config.message}</span>
                </p>
            </div>

            {config.cta && (
                <Link
                    href={verifyHref}
                    className={cn(
                        'self-start sm:self-auto shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold',
                        'bg-current/10 hover:bg-current/20 transition-colors',
                        'border border-current/20',
                        'flex items-center gap-1.5'
                    )}
                >
                    <FileCheck className="h-3.5 w-3.5"/>
                    {config.cta}
                </Link>
            )}
        </div>
    )
}
// components/ui/alert-banner.tsx
//
// Bandeau d'alerte horizontal — pleine largeur, bord inférieur.
// Usage : vérification de compte, statut d'abonnement, notices globales.
//
// Différence avec <Alert> :
//   <Alert>       → message inline dans une page/modale (arrondi, padding modeste)
//   <AlertBanner> → bandeau collé en haut d'une zone (border-b, pleine largeur)
'use client'

import * as React from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const bannerVariants = cva(
    'flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b px-4 py-3 text-sm',
    {
        variants: {
            variant: {
                warning:
                    'bg-warning-subtle border-warning/30 text-warning-foreground [&_[data-icon]]:text-warning',
                info:
                    'bg-info-subtle border-info/30 text-info [&_[data-icon]]:text-info',
                success:
                    'bg-success-subtle border-success/30 text-success [&_[data-icon]]:text-success',
                destructive:
                    'bg-destructive-subtle border-destructive/30 text-destructive [&_[data-icon]]:text-destructive',
            },
        },
        defaultVariants: {
            variant: 'warning',
        },
    }
)

const actionVariants = cva(
    'self-start sm:self-auto shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors border flex items-center gap-1.5',
    {
        variants: {
            variant: {
                warning:  'bg-warning/10 hover:bg-warning/20 border-warning/30',
                info:     'bg-info/10 hover:bg-info/20 border-info/30',
                success:  'bg-success/10 hover:bg-success/20 border-success/30',
                destructive: 'bg-destructive/10 hover:bg-destructive/20 border-destructive/30',
            },
        },
        defaultVariants: { variant: 'warning' },
    }
)

interface AlertBannerAction {
    label: string
    icon?: LucideIcon
    href?: string
    onClick?: () => void
}

export interface AlertBannerProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof bannerVariants> {
    icon?: LucideIcon
    title?: string
    action?: AlertBannerAction
}

export function AlertBanner({
    variant,
    icon: Icon,
    title,
    action,
    children,
    className,
    ...props
}: AlertBannerProps) {
    const ActionIcon = action?.icon

    return (
        <div className={cn(bannerVariants({ variant }), className)} {...props}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {Icon && (
                    <Icon
                        data-icon
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                    />
                )}
                <p className="flex-1 min-w-0">
                    {title && <span className="font-semibold">{title}. </span>}
                    {children && <span className="opacity-80">{children}</span>}
                </p>
            </div>

            {action && (
                action.href ? (
                    <Link
                        href={action.href}
                        className={cn(actionVariants({ variant }))}
                    >
                        {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
                        {action.label}
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={action.onClick}
                        className={cn(actionVariants({ variant }))}
                    >
                        {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
                        {action.label}
                    </button>
                )
            )}
        </div>
    )
}

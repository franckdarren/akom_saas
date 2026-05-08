'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    BookOpen, LayoutGrid, ShoppingCart, Package, ArrowRightLeft,
    Wallet, MonitorSmartphone, Warehouse, BarChart3, Settings2,
    ArrowRight, Check,
} from 'lucide-react'
import { AppCard } from '@/components/ui/app-card'
import { CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { initModulesFromSelection } from '@/lib/actions/modules'
import { MODULE_CATALOG, type ModuleKey, type ModuleDefinition } from '@/lib/config/modules'
import type { ActivityType } from '@/lib/config/activity-labels'
import { useNavigationLoading } from '@/lib/hooks/use-navigation-loading'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen, LayoutGrid, ShoppingCart, Package, ArrowRightLeft,
    Wallet, MonitorSmartphone, Warehouse, BarChart3,
}

interface OnboardingModulesStepProps {
    restaurantId: string
    restaurantName: string
    activityType: ActivityType
    userId: string
    defaultModules: ModuleKey[]
}

export function OnboardingModulesStep({
    restaurantId,
    restaurantName,
    activityType,
    userId,
    defaultModules,
}: OnboardingModulesStepProps) {
    const router = useRouter()
    const { startLoading } = useNavigationLoading()
    const [selected, setSelected] = useState<Set<ModuleKey>>(new Set(defaultModules))
    const [isPending, startTransition] = useTransition()

    const toggleable = (Object.values(MODULE_CATALOG) as ModuleDefinition[]).filter(m => !m.isCore)

    function toggle(key: ModuleKey) {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }

    function handleContinue() {
        startTransition(async () => {
            await initModulesFromSelection(restaurantId, Array.from(selected), userId)
            startLoading()
            router.push('/onboarding/verification')
        })
    }

    return (
        <div className="space-y-5">
            {/* Info banner */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                <span className="font-medium">{restaurantName}</span>
                {' '}— Les modules recommandés pour votre activité sont déjà cochés.
            </div>

            {/* Grille de sélection */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {toggleable.map(def => {
                    const Icon = ICON_MAP[def.iconName] ?? Settings2
                    const isSelected = selected.has(def.key)
                    const isDefault = defaultModules.includes(def.key)

                    return (
                        <button
                            key={def.key}
                            type="button"
                            onClick={() => toggle(def.key)}
                            disabled={isPending}
                            className={cn(
                                'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all',
                                'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-card hover:bg-accent/30'
                            )}
                        >
                            {/* Icône */}
                            <div className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                                isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            )}>
                                <Icon className="h-4 w-4" />
                            </div>

                            {/* Texte */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={cn('text-sm font-medium leading-tight', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                                        {def.label}
                                    </span>
                                    {isDefault && (
                                        <Badge variant="secondary" className="text-xs py-0">
                                            Recommandé
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                                    {def.description}
                                </p>
                            </div>

                            {/* Checkbox visuel */}
                            <div className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-muted-foreground/40'
                            )}>
                                {isSelected && <Check className="h-3 w-3" />}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Footer actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-2">
                <Button
                    variant="ghost"
                    className="flex-1 sm:flex-none"
                    disabled={isPending}
                    onClick={() => {
                        startTransition(async () => {
                            await initModulesFromSelection(restaurantId, Array.from(selected), userId)
                            startLoading()
                            router.push('/onboarding/verification')
                        })
                    }}
                >
                    Passer cette étape
                </Button>

                <LoadingButton
                    className="flex-1 sm:flex-none sm:ml-auto"
                    isLoading={isPending}
                    loadingText="Enregistrement..."
                    onClick={handleContinue}
                >
                    Continuer avec ces modules
                    <ArrowRight className="ml-2 h-4 w-4" />
                </LoadingButton>
            </div>

            <p className="text-center text-xs text-muted-foreground">
                Vous pouvez activer ou désactiver les modules à tout moment dans{' '}
                <span className="font-medium">Paramètres → Modules</span>.
            </p>
        </div>
    )
}

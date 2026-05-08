'use client'

import { useState, useTransition } from 'react'
import {
    BookOpen, LayoutGrid, ShoppingCart, Package, ArrowRightLeft,
    Wallet, MonitorSmartphone, Warehouse, BarChart3,
    Lock, Check, RotateCcw, Loader2, Settings2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppCard } from '@/components/ui/app-card'
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toggleModule, resetModulesToDefaults } from '@/lib/actions/modules'
import { MODULE_CATALOG, MODULE_GROUPS, getDefaultModulesForActivity, type ModuleKey, type ModuleDefinition } from '@/lib/config/modules'
import { SUBSCRIPTION_CONFIG, type SubscriptionPlan } from '@/lib/config/subscription'
import type { ActivityType } from '@/lib/config/activity-labels'
import Link from 'next/link'

// ─── Icônes par nom ───────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen, LayoutGrid, ShoppingCart, Package, ArrowRightLeft,
    Wallet, MonitorSmartphone, Warehouse, BarChart3,
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModulesManagerProps {
    restaurantId: string
    activityType: ActivityType
    currentPlan: SubscriptionPlan
    initialActiveModules: ModuleKey[]
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function ModulesManager({
    restaurantId,
    activityType,
    currentPlan,
    initialActiveModules,
}: ModulesManagerProps) {
    const [activeModules, setActiveModules] = useState<Set<ModuleKey>>(
        new Set(initialActiveModules)
    )
    const [pending, startTransition] = useTransition()
    const [loadingKey, setLoadingKey] = useState<ModuleKey | null>(null)

    const planFeatures = SUBSCRIPTION_CONFIG[currentPlan]?.features ?? {}
    const defaults = getDefaultModulesForActivity(activityType)

    function isFeatureLocked(def: ModuleDefinition): boolean {
        if (!def.requiredFeature) return false
        const val = planFeatures[def.requiredFeature as keyof typeof planFeatures]
        return val === false
    }

    function getRequiredPlanLabel(def: ModuleDefinition): string | null {
        if (!def.requiredFeature) return null
        const plans: SubscriptionPlan[] = ['starter', 'business', 'premium']
        for (const plan of plans) {
            const cfg = SUBSCRIPTION_CONFIG[plan]?.features
            const val = cfg?.[def.requiredFeature as keyof typeof cfg]
            if (val === true) return plan.charAt(0).toUpperCase() + plan.slice(1)
        }
        return null
    }

    function handleToggle(key: ModuleKey, checked: boolean) {
        // Mise à jour optimiste
        setActiveModules(prev => {
            const next = new Set(prev)
            checked ? next.add(key) : next.delete(key)
            return next
        })
        setLoadingKey(key)

        startTransition(async () => {
            const res = await toggleModule(restaurantId, key, checked)
            setLoadingKey(null)
            if (!res.success) {
                // Rollback
                setActiveModules(prev => {
                    const next = new Set(prev)
                    checked ? next.delete(key) : next.add(key)
                    return next
                })
                toast.error(res.error ?? 'Erreur lors de la mise à jour')
            } else {
                toast.success(
                    checked
                        ? `Module "${MODULE_CATALOG[key].label}" activé`
                        : `Module "${MODULE_CATALOG[key].label}" désactivé`
                )
            }
        })
    }

    function handleReset() {
        startTransition(async () => {
            const res = await resetModulesToDefaults(restaurantId, activityType)
            if (res.success) {
                setActiveModules(new Set(defaults))
                toast.success('Modules réinitialisés aux valeurs par défaut')
            } else {
                toast.error(res.error ?? 'Erreur lors de la réinitialisation')
            }
        })
    }

    const allModules = Object.values(MODULE_CATALOG) as ModuleDefinition[]
    const groups = Object.entries(MODULE_GROUPS) as [ModuleDefinition['group'], { label: string }][]

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6">

                {/* ── Grille de modules ── */}
                <div className="flex-1 layout-sections">

                    {/* Bouton reset */}
                    <div className="flex items-center justify-between">
                        <p className="type-body-muted text-sm">
                            Les modules principaux (Catalogue, Paramètres, Support) sont toujours actifs.
                        </p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={pending}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Réinitialiser
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Réinitialiser les modules ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Les modules seront remis aux valeurs recommandées pour votre type d&apos;activité.
                                        Aucune donnée ne sera supprimée.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleReset}>
                                        Réinitialiser
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {groups.map(([groupKey, groupDef]) => {
                        const groupModules = allModules.filter(m => m.group === groupKey)
                        return (
                            <div key={groupKey} className="layout-sections gap-3">
                                <p className="type-label-meta">{groupDef.label}</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {groupModules.map(def => {
                                        const Icon = ICON_MAP[def.iconName] ?? Settings2
                                        const locked = isFeatureLocked(def)
                                        const requiredPlan = getRequiredPlanLabel(def)
                                        const isActive = def.isCore || activeModules.has(def.key)
                                        const isDefault = defaults.includes(def.key)
                                        const isLoading = loadingKey === def.key

                                        return (
                                            <AppCard
                                                key={def.key}
                                                variant="flat"
                                                className={
                                                    locked
                                                        ? 'opacity-60'
                                                        : isActive
                                                            ? 'border-primary/30 bg-primary/5'
                                                            : ''
                                                }
                                            >
                                                <CardContent className="layout-card-body">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive && !locked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                                <Icon className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="type-card-title">{def.label}</p>
                                                                    {isDefault && !def.isCore && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Recommandé
                                                                        </Badge>
                                                                    )}
                                                                    {def.isCore && (
                                                                        <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                            Obligatoire
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="type-caption mt-0.5">{def.description}</p>
                                                            </div>
                                                        </div>

                                                        {/* Toggle ou cadenas */}
                                                        {locked ? (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex shrink-0 flex-col items-center gap-1">
                                                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="type-caption text-primary">{requiredPlan}</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="left" className="max-w-56">
                                                                    <p className="font-medium mb-1">Plan {requiredPlan} requis</p>
                                                                    <p className="text-xs text-muted-foreground mb-2">
                                                                        Passez au plan {requiredPlan} pour activer ce module.
                                                                    </p>
                                                                    <Link
                                                                        href="/dashboard/subscription/choose-plan"
                                                                        className="text-xs text-primary hover:underline"
                                                                    >
                                                                        Voir les plans →
                                                                    </Link>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : def.isCore ? (
                                                            <div className="flex h-5 w-9 shrink-0 items-center justify-center">
                                                                <Check className="h-4 w-4 text-primary" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex shrink-0 items-center gap-2">
                                                                {isLoading && (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                                                )}
                                                                <Switch
                                                                    checked={isActive}
                                                                    disabled={pending}
                                                                    onCheckedChange={checked => handleToggle(def.key, checked)}
                                                                    aria-label={`${isActive ? 'Désactiver' : 'Activer'} le module ${def.label}`}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </AppCard>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Aperçu live sidebar ── */}
                <div className="hidden lg:block lg:w-64 shrink-0">
                    <div className="sticky top-6">
                        <AppCard variant="default">
                            <CardHeader className="pb-3">
                                <CardTitle className="type-card-title">Aperçu de votre menu</CardTitle>
                                <CardDescription className="type-caption">
                                    Mise à jour en temps réel
                                </CardDescription>
                            </CardHeader>
                            <Separator />
                            <CardContent className="pt-3">
                                <SidebarPreview activeModules={activeModules} activityType={activityType} />
                            </CardContent>
                        </AppCard>
                    </div>
                </div>

            </div>
        </TooltipProvider>
    )
}

// ─── Mini-aperçu de la sidebar ────────────────────────────────────────────────

function SidebarPreview({
    activeModules,
    activityType,
}: {
    activeModules: Set<ModuleKey>
    activityType: ActivityType
}) {
    const previewItems: Array<{ label: string; module?: ModuleKey; always?: boolean }> = [
        { label: 'Tableau de bord', always: true },
        { label: 'Catalogue', module: 'catalog' },
        { label: 'Tables & espaces', module: 'tables' },
        { label: 'Commandes', module: 'orders' },
        { label: 'Stocks', module: 'stocks' },
        { label: 'Transactions', module: 'transactions' },
        { label: 'Caisse', module: 'caisse' },
        { label: 'Comptoir (POS)', module: 'pos' },
        { label: 'Entrepôt', module: 'warehouse' },
        { label: 'Statistiques', module: 'stats' },
        { label: 'Paramètres', always: true },
        { label: 'Utilisateurs', always: true },
        { label: 'Support', always: true },
    ]

    const visible = previewItems.filter(
        item => item.always || (item.module && (MODULE_CATALOG[item.module].isCore || activeModules.has(item.module)))
    )

    return (
        <div className="space-y-1">
            {visible.map(item => (
                <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors animate-in fade-in-0 slide-in-from-left-1"
                >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                    <span className="type-caption">{item.label}</span>
                </div>
            ))}
        </div>
    )
}

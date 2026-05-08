'use client'

import { useState, useTransition } from 'react'
import {
    BookOpen, LayoutGrid, ShoppingCart, Package, ArrowRightLeft,
    Wallet, MonitorSmartphone, Warehouse, BarChart3, Settings2,
    SlidersHorizontal, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { toggleModule } from '@/lib/actions/modules'
import { MODULE_CATALOG, type ModuleKey, type ModuleDefinition } from '@/lib/config/modules'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen, LayoutGrid, ShoppingCart, Package, ArrowRightLeft,
    Wallet, MonitorSmartphone, Warehouse, BarChart3,
}

interface ModulesQuickSheetProps {
    restaurantId: string
    activeModules: ModuleKey[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ModulesQuickSheet({
    restaurantId,
    activeModules: initialModules,
    open,
    onOpenChange,
}: ModulesQuickSheetProps) {
    const [activeModules, setActiveModules] = useState<Set<ModuleKey>>(
        new Set(initialModules)
    )
    const [pending, startTransition] = useTransition()
    const [loadingKey, setLoadingKey] = useState<ModuleKey | null>(null)

    const toggleable = (Object.values(MODULE_CATALOG) as ModuleDefinition[]).filter(m => !m.isCore)

    function handleToggle(key: ModuleKey, checked: boolean) {
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
                setActiveModules(prev => {
                    const next = new Set(prev)
                    checked ? next.delete(key) : next.add(key)
                    return next
                })
                toast.error(res.error ?? 'Erreur')
            }
        })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-80 sm:w-80 flex flex-col">
                <SheetHeader>
                    <SheetTitle className="type-dialog-title">Modules actifs</SheetTitle>
                    <SheetDescription className="type-caption">
                        Activez ou désactivez en un clic.
                    </SheetDescription>
                </SheetHeader>

                <Separator className="my-4" />

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {toggleable.map(def => {
                        const Icon = ICON_MAP[def.iconName] ?? Settings2
                        const isActive = activeModules.has(def.key)
                        const isLoading = loadingKey === def.key

                        return (
                            <div
                                key={def.key}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                                    isActive ? 'bg-primary/5' : 'hover:bg-muted/50'
                                )}
                            >
                                <div className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                                    isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                )}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={cn('text-sm font-medium leading-tight truncate', !isActive && 'text-muted-foreground')}>
                                        {def.label}
                                    </p>
                                </div>

                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                                ) : (
                                    <Switch
                                        checked={isActive}
                                        disabled={pending}
                                        onCheckedChange={checked => handleToggle(def.key, checked)}
                                        aria-label={def.label}
                                        className="shrink-0"
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                <Separator className="my-4" />

                <Link
                    href="/dashboard/settings/modules"
                    onClick={() => onOpenChange(false)}
                    className="block"
                >
                    <Button variant="outline" className="w-full" size="sm">
                        Gérer tous les modules
                    </Button>
                </Link>
            </SheetContent>
        </Sheet>
    )
}

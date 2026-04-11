'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ReactNode } from 'react'
import { useTransition, useState } from 'react'
import { Loader2 } from 'lucide-react'

const TABS = [
    { value: 'overview', label: "Vue d'ensemble" },
    { value: 'finances', label: 'Finances' },
    { value: 'orders', label: 'Commandes' },
    { value: 'products', label: 'Produits & Stock' },
    { value: 'cash', label: 'Caisse & Équipe' },
    { value: 'customers', label: 'Clients' },
]

interface StatsPageTabsProps {
    activeTab: string
    children: ReactNode
}

export function StatsPageTabs({ activeTab, children }: StatsPageTabsProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [pendingTab, setPendingTab] = useState<string | null>(null)

    function handleTabChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)
        setPendingTab(value)
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`)
        })
    }

    // Reset pendingTab quand la navigation est terminée
    if (!isPending && pendingTab !== null) {
        setPendingTab(null)
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-auto flex-wrap gap-1">
                {TABS.map((tab) => {
                    const isLoading = isPending && pendingTab === tab.value
                    return (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            disabled={isPending}
                            className="gap-1.5"
                        >
                            {isLoading && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {tab.label}
                        </TabsTrigger>
                    )
                })}
            </TabsList>
            <div className={isPending ? 'opacity-50 pointer-events-none transition-opacity duration-150' : 'transition-opacity duration-150'}>
                {children}
            </div>
        </Tabs>
    )
}

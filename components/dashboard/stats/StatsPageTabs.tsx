'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ReactNode } from 'react'

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

    function handleTabChange(value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-auto flex-wrap gap-1">
                {TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {children}
        </Tabs>
    )
}

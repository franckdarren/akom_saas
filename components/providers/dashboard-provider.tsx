// components/providers/dashboard-provider.tsx
'use client'

import {createContext, useContext} from 'react'
import type {ActivityType} from '@/lib/config/activity-labels'

type DashboardContextType = {
    user: {
        id: string
        email: string
    }
    role: string // slug du rôle : 'admin', 'kitchen', 'cashier', 'superadmin' ou slug custom
    restaurantName?: string
    activityType?: ActivityType // ← NOUVEAU
}

const DashboardContext = createContext<DashboardContextType | undefined>(
    undefined
)

export function DashboardProvider({
                                      value,
                                      children,
                                  }: {
    value: DashboardContextType
    children: React.ReactNode
}) {
    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    )
}

export function useDashboard() {
    const context = useContext(DashboardContext)
    if (!context) {
        throw new Error(
            'useDashboard must be used inside DashboardProvider'
        )
    }
    return context
}
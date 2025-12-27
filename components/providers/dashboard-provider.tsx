// components/providers/dashboard-provider.tsx
'use client'

import { createContext, useContext } from 'react'

type DashboardContextType = {
    user: {
        id: string
        email: string
    }
    role: 'superadmin' | 'admin' | 'kitchen'
    restaurantName?: string
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

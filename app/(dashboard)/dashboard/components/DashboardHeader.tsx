'use client'

import { ModeToggle } from '@/components/ui/mode-toggle'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface DashboardHeaderProps {
    userId?: string
}

export function DashboardHeader({ userId }: DashboardHeaderProps) {
    return (
        <header className="">
            <div className="flex items-center gap-1">
                {userId && <NotificationBell userId={userId} />}
                <ModeToggle />
            </div>
        </header>
    )
}

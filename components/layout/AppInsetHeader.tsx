'use client'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { useCurrentUserId } from '@/lib/hooks/use-current-user-id'
import { cn } from '@/lib/utils'

interface AppInsetHeaderProps {
    children?: React.ReactNode
    className?: string
}

export function AppInsetHeader({ children, className }: AppInsetHeaderProps) {
    const userId = useCurrentUserId()
    return (
        <header className={cn('flex h-16 shrink-0 items-center gap-2 border-b px-4', className)}>
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center">
                {children}
            </div>
            <div className="flex items-center gap-1">
                {userId && <NotificationBell userId={userId} />}
                <ModeToggle />
            </div>
        </header>
    )
}

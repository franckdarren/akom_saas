'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/lib/hooks/use-notifications'
import type { NotificationListItem } from '@/lib/actions/notifications'

interface NotificationBellProps {
    userId: string
}

const PRIORITY_DOT: Record<string, string> = {
    low: 'bg-muted-foreground/40',
    normal: 'bg-info',
    high: 'bg-warning',
    urgent: 'bg-destructive',
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const router = useRouter()
    const { items, unreadCount, markRead, markAllRead } = useNotifications(userId)

    const handleClick = async (n: NotificationListItem) => {
        if (!n.readAt) await markRead(n.id)
        if (n.actionUrl) router.push(n.actionUrl)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={`Notifications${unreadCount ? ` (${unreadCount} non lues)` : ''}`}
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-2xs"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[380px] p-0">
                <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                    <span className="type-label-meta">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllRead}
                            className="h-auto p-1 text-xs"
                        >
                            <CheckCheck className="mr-1 size-3" />
                            Tout marquer lu
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-0" />

                {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                        <Bell className="size-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Aucune notification</p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[420px]">
                        <ul className="divide-y">
                            {items.map((n) => (
                                <li key={n.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleClick(n)}
                                        className={cn(
                                            'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-accent',
                                            !n.readAt && 'bg-primary/5'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'mt-1.5 size-2 shrink-0 rounded-full',
                                                PRIORITY_DOT[n.priority] ?? PRIORITY_DOT.normal
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={cn(
                                                    'truncate text-sm',
                                                    !n.readAt ? 'font-semibold' : 'font-medium'
                                                )}
                                            >
                                                {n.title}
                                            </p>
                                            <p className="line-clamp-2 text-xs text-muted-foreground">
                                                {n.body}
                                            </p>
                                            <p className="mt-1 text-2xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(n.createdAt), {
                                                    addSuffix: true,
                                                    locale: fr,
                                                })}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                )}

                <DropdownMenuSeparator className="my-0" />
                <div className="p-2">
                    <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                        <Link href="/dashboard/notifications">Voir toutes les notifications</Link>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

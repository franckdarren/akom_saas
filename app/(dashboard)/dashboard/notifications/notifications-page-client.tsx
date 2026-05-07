'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Settings2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AppCard, CardContent, CardHeader, CardTitle } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { NotificationDetailModal } from '@/components/notifications/NotificationDetailModal'
import type { NotificationListItem } from '@/lib/actions/notifications'

const PRIORITY_DOT: Record<string, string> = {
    low: 'bg-muted-foreground/40',
    normal: 'bg-info',
    high: 'bg-warning',
    urgent: 'bg-destructive',
}

const PRIORITY_LABEL: Record<string, string> = {
    low: 'Info',
    normal: 'Normale',
    high: 'Importante',
    urgent: 'Urgente',
}

const TICKET_TYPES = new Set(['support_reply', 'support_ticket_resolved', 'new_support_ticket'])

interface Props {
    userId: string
}

export function NotificationsPageClient({ userId }: Props) {
    const router = useRouter()
    const { items, unreadCount, loading, markRead, markAllRead } = useNotifications(userId)
    const [tab, setTab] = useState<'all' | 'unread'>('all')
    const [detailNotif, setDetailNotif] = useState<NotificationListItem | null>(null)

    const filtered = useMemo(
        () => (tab === 'unread' ? items.filter((n) => !n.readAt) : items),
        [items, tab]
    )

    const handleClick = async (n: NotificationListItem) => {
        if (!n.readAt) await markRead(n.id)
        if (TICKET_TYPES.has(n.type)) {
            if (n.actionUrl) router.push(n.actionUrl)
        } else {
            setDetailNotif(n)
        }
    }

    return (
        <>
            <div className="layout-sections">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="type-page-title">Notifications</h1>
                        <p className="type-body-muted">
                            Toutes vos alertes et messages au même endroit.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button onClick={markAllRead} variant="outline" size="sm">
                                <CheckCheck className="mr-2 size-4" />
                                Tout marquer comme lu
                            </Button>
                        )}
                        <Button asChild variant="outline" size="sm">
                            <Link href="/dashboard/notifications/settings">
                                <Settings2 className="mr-2 size-4" />
                                Préférences
                            </Link>
                        </Button>
                    </div>
                </div>

                <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')}>
                    <TabsList>
                        <TabsTrigger value="all">Toutes</TabsTrigger>
                        <TabsTrigger value="unread">
                            Non lues
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {unreadCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <AppCard>
                    <CardHeader>
                        <CardTitle className="type-card-title">
                            {tab === 'unread' ? 'Non lues' : 'Récentes'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                                Chargement...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="layout-empty-state">
                                <Bell className="size-10 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">
                                    {tab === 'unread'
                                        ? 'Aucune notification non lue.'
                                        : 'Aucune notification pour le moment.'}
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {filtered.map((n) => (
                                    <li key={n.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleClick(n)}
                                            className={cn(
                                                'flex w-full items-start gap-4 px-6 py-4 text-left transition hover:bg-accent',
                                                !n.readAt && 'bg-primary/5'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'mt-1.5 size-2.5 shrink-0 rounded-full',
                                                    PRIORITY_DOT[n.priority] ?? PRIORITY_DOT.normal
                                                )}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p
                                                        className={cn(
                                                            'truncate text-sm',
                                                            !n.readAt ? 'font-semibold' : 'font-medium'
                                                        )}
                                                    >
                                                        {n.title}
                                                    </p>
                                                    <Badge variant="outline" className="text-2xs">
                                                        {PRIORITY_LABEL[n.priority] ?? n.priority}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {n.body}
                                                </p>
                                                <p className="mt-2 type-caption">
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
                        )}
                    </CardContent>
                </AppCard>
            </div>

            <NotificationDetailModal
                notification={detailNotif}
                onClose={() => setDetailNotif(null)}
            />
        </>
    )
}

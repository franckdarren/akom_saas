'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
    listMyNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    type NotificationListItem,
} from '@/lib/actions/notifications'

interface UseNotificationsResult {
    items: NotificationListItem[]
    unreadCount: number
    loading: boolean
    refresh: () => Promise<void>
    markRead: (id: string) => Promise<void>
    markAllRead: () => Promise<void>
}

/**
 * Hook centralisé pour les notifications de l'utilisateur courant.
 * - charge les 20 dernières notifs au montage
 * - écoute les `INSERT` sur `notifications` filtrés par `user_id` (Supabase Realtime)
 * - toast `sonner` automatique sur priorité `high`/`urgent`
 */
export function useNotifications(userId: string | undefined): UseNotificationsResult {
    const router = useRouter()
    const supabase = createClient()
    const [items, setItems] = useState<NotificationListItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const seenIdsRef = useRef<Set<string>>(new Set())

    const refresh = useCallback(async () => {
        try {
            const { items: list, unreadCount: count } = await listMyNotifications({ limit: 20 })
            setItems(list)
            setUnreadCount(count)
            // Mémoriser les IDs déjà vus pour éviter les double-toasts
            list.forEach((n) => seenIdsRef.current.add(n.id))
        } catch (err) {
            console.error('[useNotifications] refresh failed', err)
        } finally {
            setLoading(false)
        }
    }, [])

    // Chargement initial
    useEffect(() => {
        if (!userId) return
        refresh()
    }, [userId, refresh])

    // Realtime
    useEffect(() => {
        if (!userId) return

        let channel: ReturnType<typeof supabase.channel> | null = null
        let cancelled = false

        const setup = async () => {
            // Synchroniser l'auth du websocket Realtime avec la session courante.
            // Sans ça, le canal peut rester en état "anonyme" et ne reçoit aucun
            // événement filtré quand la table est en RLS ou en publication restreinte.
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
                await supabase.realtime.setAuth(session.access_token)
            }
            if (cancelled) return

            channel = supabase
                .channel(`notifications:${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        const row = payload.new as Record<string, unknown>
                        if (!row?.id || seenIdsRef.current.has(row.id as string)) return

                        // Toast pour priorités élevées
                        const priority = row.priority as string
                        if (priority === 'high' || priority === 'urgent') {
                            const actionUrl = (row.action_url as string | null) ?? null
                            toast(row.title as string, {
                                description: row.body as string,
                                action: actionUrl
                                    ? {
                                          label: 'Voir',
                                          onClick: () => router.push(actionUrl),
                                      }
                                    : undefined,
                            })
                        }

                        // Refetch pour avoir l'item formaté + recompter l'unread
                        refresh()
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        console.warn('[notifications] realtime status:', status, err)
                    }
                })
        }

        setup()

        // Re-synchroniser le token Realtime à chaque changement d'auth (refresh, login, logout)
        const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.access_token) {
                supabase.realtime.setAuth(session.access_token)
            }
        })

        return () => {
            cancelled = true
            if (channel) supabase.removeChannel(channel)
            authSub.subscription.unsubscribe()
        }
    }, [userId, refresh, router, supabase])

    const markRead = useCallback(async (id: string) => {
        await markNotificationAsRead(id)
        setItems((prev) =>
            prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
    }, [])

    const markAllRead = useCallback(async () => {
        await markAllNotificationsAsRead()
        setItems((prev) =>
            prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
        )
        setUnreadCount(0)
    }, [])

    return { items, unreadCount, loading, refresh, markRead, markAllRead }
}

// app/(dashboard)/superadmin/support/SupportTicketsTable.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/format'

export type SupportTicket = {
    id: string
    subject: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    createdAt: string | Date
    restaurantId: string
    restaurant: { name: string }
    _count: { messages: number }
}

export default function SupportTicketsTable({ tickets }: { tickets: SupportTicket[] }) {
    function getStatusBadge(status: SupportTicket['status']) {
        const variants = {
            open: { label: 'Ouvert', variant: 'destructive' as const },
            in_progress: { label: 'En cours', variant: 'default' as const },
            resolved: { label: 'Résolu', variant: 'outline' as const },
            closed: { label: 'Fermé', variant: 'outline' as const },
        }
        return variants[status] || variants.open
    }

    function getPriorityBadge(priority: SupportTicket['priority']) {
        const variants = {
            urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
            high: { label: 'Haute', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
            medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
            low: { label: 'Basse', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
        }
        return variants[priority] || variants.medium
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tickets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-zinc-600 dark:text-zinc-400">
                            Aucun ticket
                        </TableCell>
                    </TableRow>
                ) : (
                    tickets.map((ticket) => {
                        const statusBadge = getStatusBadge(ticket.status)
                        const priorityBadge = getPriorityBadge(ticket.priority)

                        return (
                            <TableRow key={ticket.id}>
                                <TableCell className="font-medium">{ticket.subject}</TableCell>
                                <TableCell>
                                    <Link href={`/superadmin/restaurants/${ticket.restaurantId}`} className="hover:underline">
                                        {ticket.restaurant.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge className={priorityBadge.color}>{priorityBadge.label}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                                        {ticket._count.messages}
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-600 dark:text-zinc-400">
                                    {formatDate(typeof ticket.createdAt === 'string' ? new Date(ticket.createdAt) : ticket.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/superadmin/support/${ticket.id}`}>Voir</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })
                )}
            </TableBody>
        </Table>
    )
}

'use client'

import {Badge} from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {MessageSquare} from 'lucide-react'
import Link from 'next/link'
import {formatDate} from '@/lib/utils/format'

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

export default function SupportTicketsTable({
                                                tickets,
                                            }: {
    tickets: SupportTicket[]
}) {
    function getStatusBadge(status: SupportTicket['status']) {
        const variants = {
            open: {label: 'Ouvert', variant: 'destructive' as const},
            in_progress: {label: 'En cours', variant: 'secondary' as const},
            resolved: {label: 'Résolu', variant: 'outline' as const},
            closed: {label: 'Fermé', variant: 'outline' as const},
        }
        return variants[status] || variants.open
    }

    function getPriorityBadge(priority: SupportTicket['priority']) {
        const variants = {
            urgent: {label: 'Urgent', variant: 'destructive' as const},
            high: {label: 'Haute', variant: 'secondary' as const},
            medium: {label: 'Moyenne', variant: 'outline' as const},
            low: {label: 'Basse', variant: 'outline' as const},
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
                        <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground"
                        >
                            Aucun ticket
                        </TableCell>
                    </TableRow>
                ) : (
                    tickets.map((ticket) => {
                        const statusBadge = getStatusBadge(ticket.status)
                        const priorityBadge = getPriorityBadge(ticket.priority)

                        return (
                            <TableRow key={ticket.id}>
                                <TableCell className="font-medium">
                                    {ticket.subject}
                                </TableCell>

                                <TableCell>
                                    <Link
                                        href={`/superadmin/restaurants/${ticket.restaurantId}`}
                                        className="text-primary hover:underline"
                                    >
                                        {ticket.restaurant.name}
                                    </Link>
                                </TableCell>

                                <TableCell>
                                    <Badge variant={priorityBadge.variant}>
                                        {priorityBadge.label}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <Badge variant={statusBadge.variant}>
                                        {statusBadge.label}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MessageSquare className="h-4 w-4"/>
                                        {ticket._count.messages}
                                    </div>
                                </TableCell>

                                <TableCell className="text-muted-foreground">
                                    {formatDate(
                                        typeof ticket.createdAt === 'string'
                                            ? new Date(ticket.createdAt)
                                            : ticket.createdAt
                                    )}
                                </TableCell>

                                <TableCell className="text-right">
                                    <Link href={`/superadmin/support/${ticket.id}`}>
                                        <Button variant="ghost" size="sm">
                                            <MessageSquare className="h-4 w-4 mr-1"/>
                                            Ouvrir
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        )
                    })
                )}
            </TableBody>
        </Table>
    )
}

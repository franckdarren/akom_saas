'use client'

import { getAllTickets, getSupportStats } from '@/lib/actions/support'
import { formatDate } from '@/lib/utils/format'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// ----------------------------
// Typage des données
// ----------------------------

export type SupportTicket = {
    id: string
    subject: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    createdAt: string | Date
    restaurantId: string
    restaurant: {
        name: string
    }
    _count: {
        messages: number
    }
}

export type SupportStats = {
    total: number
    open: number
    inProgress: number
    resolved: number
}


export default async function SupportPage() {
    const [tickets, stats]: [SupportTicket[], SupportStats] = await Promise.all([
        getAllTickets(),
        getSupportStats(),
    ])

    // Badge selon le statut
    function getStatusBadge(status: SupportTicket['status']) {
        const variants: Record<
            SupportTicket['status'],
            { label: string; variant: 'default' | 'destructive' | 'outline' }
        > = {
            open: { label: 'Ouvert', variant: 'destructive' },
            in_progress: { label: 'En cours', variant: 'default' },
            resolved: { label: 'Résolu', variant: 'outline' },
            closed: { label: 'Fermé', variant: 'outline' },
        }
        return variants[status] || variants.open
    }

    // Badge selon la priorité
    function getPriorityBadge(priority: SupportTicket['priority']) {
        const variants: Record<SupportTicket['priority'], { label: string; color: string }> = {
            urgent: {
                label: 'Urgent',
                color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            },
            high: {
                label: 'Haute',
                color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            },
            medium: {
                label: 'Moyenne',
                color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            },
            low: {
                label: 'Basse',
                color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            },
        }
        return variants[priority] || variants.medium
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Support</h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Gestion des tickets de support
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <MessageSquare className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.open}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">En cours</CardTitle>
                        <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Résolus</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.resolved}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Liste des tickets */}
            <Card>
                <CardHeader>
                    <CardTitle>Tickets de support</CardTitle>
                    <CardDescription>
                        Tous les tickets, triés par priorité et date
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                        className="text-center text-zinc-600 dark:text-zinc-400"
                                    >
                                        Aucun ticket
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tickets.map((ticket: SupportTicket) => {
                                    const statusBadge = getStatusBadge(ticket.status)
                                    const priorityBadge = getPriorityBadge(ticket.priority)

                                    return (
                                        <TableRow key={ticket.id}>
                                            <TableCell className="font-medium">{ticket.subject}</TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/superadmin/restaurants/${ticket.restaurantId}`}
                                                    className="hover:underline"
                                                >
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
                </CardContent>
            </Card>
        </div>
    )
}

'use client'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {formatDate} from '@/lib/utils/format'
import {
    Building2,
    Mail,
    Phone,
    Calendar,
    Clock,
    AlertTriangle,
    MessageSquare,
} from 'lucide-react'
import type {SupportTicket} from '@prisma/client'

interface TicketWithRelations extends SupportTicket {
    restaurant: {
        id: string
        name: string
        email: string
        phone: string | null
    }
    _count: {
        messages: number
    }
}

interface TicketInfoSidebarProps {
    ticket: TicketWithRelations
}

export function TicketInfoSidebar({
                                      ticket,
                                  }: TicketInfoSidebarProps) {
    const getStatusBadge = (status: string) => {
        const variants = {
            open: {label: 'Ouvert', variant: 'default' as const},
            in_progress: {label: 'En cours', variant: 'secondary' as const},
            resolved: {label: 'Résolu', variant: 'outline' as const},
            closed: {label: 'Fermé', variant: 'outline' as const},
        }

        const current = variants[status as keyof typeof variants]

        return <Badge variant={current.variant}>{current.label}</Badge>
    }

    const getPriorityBadge = (priority: string) => {
        const variants = {
            low: {label: 'Basse', variant: 'outline' as const},
            medium: {label: 'Moyenne', variant: 'secondary' as const},
            high: {label: 'Haute', variant: 'default' as const},
            urgent: {label: 'Urgente', variant: 'destructive' as const},
        }

        const current = variants[priority as keyof typeof variants]

        return <Badge variant={current.variant}>{current.label}</Badge>
    }

    return (
        <div className="space-y-4">

            {/* Statut */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        État du ticket
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Statut
            </span>
                        {getStatusBadge(ticket.status)}
                    </div>

                    <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Priorité
            </span>
                        {getPriorityBadge(ticket.priority)}
                    </div>

                    <Separator/>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4"/>
                        <span>{ticket._count.messages} messages</span>
                    </div>
                </CardContent>
            </Card>

            {/* Restaurant */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground"/>
                        Restaurant
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    <p className="font-semibold">
                        {ticket.restaurant.name}
                    </p>

                    {ticket.restaurant.email && (
                        <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5"/>
                            <a
                                href={`mailto:${ticket.restaurant.email}`}
                                className="text-sm text-primary hover:underline break-all"
                            >
                                {ticket.restaurant.email}
                            </a>
                        </div>
                    )}

                    {ticket.restaurant.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground"/>
                            <a
                                href={`tel:${ticket.restaurant.phone}`}
                                className="text-sm text-primary hover:underline"
                            >
                                {ticket.restaurant.phone}
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Chronologie */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Chronologie
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">

                    <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5"/>
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                                Créé le
                            </p>
                            <p className="text-sm">
                                {formatDate(ticket.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5"/>
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                                Dernière mise à jour
                            </p>
                            <p className="text-sm">
                                {formatDate(ticket.updatedAt)}
                            </p>
                        </div>
                    </div>

                    {ticket.resolvedAt && (
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-primary mt-0.5"/>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">
                                    Résolu le
                                </p>
                                <p className="text-sm">
                                    {formatDate(ticket.resolvedAt)}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Description */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Description initiale
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {ticket.description}
                    </p>
                </CardContent>
            </Card>

        </div>
    )
}

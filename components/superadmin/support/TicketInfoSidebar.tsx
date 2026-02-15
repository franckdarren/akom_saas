'use client'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Separator} from '@/components/ui/separator'
import {formatDate} from '@/lib/utils/format'
import {cn} from '@/lib/utils'
import {
    Building2,
    Mail,
    Phone,
    Calendar,
    Clock,
    AlertTriangle,
    MessageSquare
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

/**
 * Sidebar d'informations contextuelles
 *
 * Affiche :
 * - Statut et priorité visuels
 * - Infos restaurant (nom, email, téléphone)
 * - Métadonnées du ticket (création, dernière mise à jour)
 * - Nombre de messages
 *
 * Pourquoi c'est important ?
 * - Le SuperAdmin a besoin du contexte pour personnaliser sa réponse
 * - Contact direct si besoin (email, téléphone)
 * - Suivi temporel du ticket
 */
export function TicketInfoSidebar({ticket}: TicketInfoSidebarProps) {
    const getStatusBadge = (status: string) => {
        const variants = {
            open: 'bg-blue-500',
            in_progress: 'bg-yellow-500',
            resolved: 'bg-green-500',
            closed: 'bg-gray-500'
        }
        const labels = {
            open: 'Ouvert',
            in_progress: 'En cours',
            resolved: 'Résolu',
            closed: 'Fermé'
        }
        return (
            <Badge className={cn('text-white', variants[status as keyof typeof variants])}>
                {labels[status as keyof typeof labels]}
            </Badge>
        )
    }

    const getPriorityBadge = (priority: string) => {
        const variants = {
            low: 'bg-gray-400',
            medium: 'bg-blue-500',
            high: 'bg-orange-500',
            urgent: 'bg-red-600'
        }
        const labels = {
            low: 'Basse',
            medium: 'Moyenne',
            high: 'Haute',
            urgent: 'Urgente'
        }
        return (
            <Badge className={cn('text-white', variants[priority as keyof typeof variants])}>
                {labels[priority as keyof typeof labels]}
            </Badge>
        )
    }

    return (
        <div className="space-y-4">
            {/* Card Statut */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">État du ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Statut</span>
                        {getStatusBadge(ticket.status)}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Priorité</span>
                        {getPriorityBadge(ticket.priority)}
                    </div>
                    <Separator/>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageSquare className="h-4 w-4"/>
                        <span>{ticket._count.messages} messages</span>
                    </div>
                </CardContent>
            </Card>

            {/* Card Restaurant */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4"/>
                        Restaurant
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <p className="font-semibold">{ticket.restaurant.name}</p>
                    </div>

                    {ticket.restaurant.email && (
                        <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-gray-400 mt-0.5"/>
                            <a
                                href={`mailto:${ticket.restaurant.email}`}
                                className="text-sm text-blue-600 hover:underline break-all"
                            >
                                {ticket.restaurant.email}
                            </a>
                        </div>
                    )}

                    {ticket.restaurant.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400"/>
                            <a
                                href={`tel:${ticket.restaurant.phone}`}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                {ticket.restaurant.phone}
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card Dates */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Chronologie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 mt-0.5"/>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Créé le</p>
                            <p className="text-sm">{formatDate(ticket.createdAt)}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5"/>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Dernière mise à jour</p>
                            <p className="text-sm">{formatDate(ticket.updatedAt)}</p>
                        </div>
                    </div>

                    {ticket.resolvedAt && (
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-green-500 mt-0.5"/>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500">Résolu le</p>
                                <p className="text-sm">{formatDate(ticket.resolvedAt)}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card Description initiale */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Description initiale</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {ticket.description}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
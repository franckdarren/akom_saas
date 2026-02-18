'use client'

import {useState} from 'react'
import {Check, X, Clock, AlertTriangle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    updateTicketStatus,
    updateTicketPriority,
    resolveTicket,
    closeTicket,
} from '@/lib/actions/support'
import {toast} from 'sonner'
import type {
    SupportTicket,
    TicketStatus,
    TicketPriority,
} from '@prisma/client'

interface TicketQuickActionsProps {
    ticket: SupportTicket
    onUpdate: (ticket: Partial<SupportTicket>) => void
}

export function TicketQuickActions({
                                       ticket,
                                       onUpdate,
                                   }: TicketQuickActionsProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleStatusChange = async (status: TicketStatus) => {
        setIsLoading(true)

        const result = await updateTicketStatus({
            ticketId: ticket.id,
            status,
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            onUpdate({status})
            toast.success('Statut mis à jour')
        }

        setIsLoading(false)
    }

    const handlePriorityChange = async (
        priority: TicketPriority
    ) => {
        setIsLoading(true)

        const result = await updateTicketPriority({
            ticketId: ticket.id,
            priority,
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            onUpdate({priority})
            toast.success('Priorité mise à jour')
        }

        setIsLoading(false)
    }

    const handleResolve = async () => {
        setIsLoading(true)

        const result = await resolveTicket(ticket.id)

        if (result.error) {
            toast.error(result.error)
        } else {
            onUpdate({
                status: 'resolved',
                resolvedAt: new Date(),
            })
            toast.success('Ticket résolu')
        }

        setIsLoading(false)
    }

    const handleClose = async () => {
        setIsLoading(true)

        const result = await closeTicket(ticket.id)

        if (result.error) {
            toast.error(result.error)
        } else {
            onUpdate({status: 'closed'})
            toast.success('Ticket fermé')
        }

        setIsLoading(false)
    }

    return (
        <div className="flex items-center gap-2">

            {/* Dropdown Statut */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                    >
                        <Clock className="h-4 w-4 mr-2"/>
                        Statut
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                        Changer le statut
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem
                        onClick={() => handleStatusChange('open')}
                    >
                        Ouvert
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleStatusChange('in_progress')}
                    >
                        En cours
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleStatusChange('resolved')}
                    >
                        Résolu
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleStatusChange('closed')}
                    >
                        Fermé
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dropdown Priorité */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                    >
                        <AlertTriangle className="h-4 w-4 mr-2"/>
                        Priorité
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                        Changer la priorité
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem
                        onClick={() => handlePriorityChange('low')}
                    >
                        Basse
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handlePriorityChange('medium')}
                    >
                        Moyenne
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handlePriorityChange('high')}
                    >
                        Haute
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handlePriorityChange('urgent')}
                    >
                        Urgente
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Résoudre */}
            {ticket.status !== 'resolved' && (
                <Button
                    onClick={handleResolve}
                    size="sm"
                    variant="default"
                    disabled={isLoading}
                >
                    <Check className="h-4 w-4 mr-2"/>
                    Résoudre
                </Button>
            )}

            {/* Fermer */}
            {ticket.status !== 'closed' && (
                <Button
                    onClick={handleClose}
                    size="sm"
                    variant="destructive"
                    disabled={isLoading}
                >
                    <X className="h-4 w-4 mr-2"/>
                    Fermer
                </Button>
            )}

        </div>
    )
}

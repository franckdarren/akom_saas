'use client'

import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {formatDate} from '@/lib/utils/format'
import {cn} from '@/lib/utils'
import {User, Shield} from 'lucide-react'

interface Message {
    id: string
    message: string
    isAdmin: boolean
    createdAt: Date
    userId: string
}

interface TicketMessageListProps {
    messages: Message[]
}

/**
 * Composant de liste de messages optimisé pour la lecture
 *
 * Design :
 * - Messages admin à gauche (gris) avec icône Shield
 * - Messages client à droite (bleu) avec icône User
 * - Timestamps discrets mais visibles
 * - Espacement généreux pour la lisibilité
 */
export function TicketMessageList({messages}: TicketMessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                    <p className="text-sm">Aucun message pour le moment</p>
                    <p className="text-xs mt-1">Les messages apparaîtront ici</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {messages.map((message, index) => {
                // Afficher la date si c'est le premier message ou si le jour a changé
                const showDate = index === 0 ||
                    new Date(messages[index - 1].createdAt).toDateString() !==
                    new Date(message.createdAt).toDateString()

                return (
                    <div key={message.id}>
                        {/* Séparateur de date */}
                        {showDate && (
                            <div className="flex items-center justify-center my-4">
                                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                    {new Date(message.createdAt).toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Message */}
                        <div
                            className={cn(
                                'flex gap-3',
                                message.isAdmin ? 'flex-row' : 'flex-row-reverse'
                            )}
                        >
                            {/* Avatar */}
                            <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback
                                    className={cn(
                                        'text-white',
                                        message.isAdmin
                                            ? 'bg-gradient-to-br from-blue-600 to-blue-700'
                                            : 'bg-gradient-to-br from-gray-500 to-gray-600'
                                    )}
                                >
                                    {message.isAdmin ? (
                                        <Shield className="h-5 w-5"/>
                                    ) : (
                                        <User className="h-5 w-5"/>
                                    )}
                                </AvatarFallback>
                            </Avatar>

                            {/* Bulle de message */}
                            <div className={cn('flex flex-col max-w-[75%]')}>
                                <div
                                    className={cn(
                                        'rounded-2xl px-4 py-3 shadow-sm',
                                        message.isAdmin
                                            ? 'bg-gray-100 text-gray-900 rounded-tl-none'
                                            : 'bg-blue-600 text-white rounded-tr-none'
                                    )}
                                >
                                    {/* Badge "Support" pour les messages admin */}
                                    {message.isAdmin && (
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="text-xs font-semibold text-blue-600">
                                                Support Akôm
                                            </span>
                                        </div>
                                    )}

                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {message.message}
                                    </p>
                                </div>

                                {/* Timestamp */}
                                <span
                                    className={cn(
                                        'text-xs mt-1 px-1',
                                        message.isAdmin ? 'text-gray-500' : 'text-gray-500 text-right'
                                    )}
                                >
                                    {formatDate(message.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
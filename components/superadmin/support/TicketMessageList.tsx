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

export function TicketMessageList({
                                      messages,
                                  }: TicketMessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                    <p className="text-sm">Aucun message pour le moment</p>
                    <p className="text-xs mt-1">
                        Les messages apparaîtront ici
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {messages.map((message, index) => {
                const showDate =
                    index === 0 ||
                    new Date(
                        messages[index - 1].createdAt
                    ).toDateString() !==
                    new Date(message.createdAt).toDateString()

                return (
                    <div key={message.id}>
                        {/* Séparateur de date */}
                        {showDate && (
                            <div className="flex items-center justify-center my-4">
                                <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                                    {new Date(message.createdAt).toLocaleDateString(
                                        'fr-FR',
                                        {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        }
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Message */}
                        <div
                            className={cn(
                                'flex gap-3',
                                message.isAdmin
                                    ? 'flex-row'
                                    : 'flex-row-reverse'
                            )}
                        >
                            {/* Avatar */}
                            <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback
                                    className={cn(
                                        message.isAdmin
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    )}
                                >
                                    {message.isAdmin ? (
                                        <Shield className="h-5 w-5"/>
                                    ) : (
                                        <User className="h-5 w-5"/>
                                    )}
                                </AvatarFallback>
                            </Avatar>

                            {/* Bulle */}
                            <div className="flex flex-col max-w-[75%]">
                                <div
                                    className={cn(
                                        'rounded-2xl px-4 py-3 shadow-sm',
                                        message.isAdmin
                                            ? 'bg-muted text-foreground rounded-tl-none'
                                            : 'bg-primary text-primary-foreground rounded-tr-none'
                                    )}
                                >
                                    {message.isAdmin && (
                                        <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs font-semibold text-primary">
                        Support
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
                                        'text-xs mt-1 px-1 text-muted-foreground',
                                        !message.isAdmin && 'text-right'
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

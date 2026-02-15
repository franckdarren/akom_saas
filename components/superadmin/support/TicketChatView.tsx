'use client'

import {useState, useEffect, useRef} from 'react'
import {Send, Loader2, AlertCircle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Card} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {sendAdminMessage, getTicketMessages} from '@/lib/actions/support'
import {toast} from 'sonner'
import {TicketMessageList} from './TicketMessageList'
import {TicketQuickActions} from './TicketQuickActions'
import {TicketInfoSidebar} from './TicketInfoSidebar'
import type {SupportTicket} from '@prisma/client'

/**
 * Composant principal de conversation pour SuperAdmin
 *
 * Pourquoi cette structure ?
 * - Layout en 3 colonnes : liste messages + sidebar infos
 * - Polling automatique pour temps réel
 * - Actions rapides accessibles sans quitter la conversation
 * - Auto-scroll vers le bas à chaque nouveau message
 */

interface Message {
    id: string
    message: string
    isAdmin: boolean
    createdAt: Date
    userId: string
}

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

interface TicketChatViewProps {
    ticket: TicketWithRelations
    initialMessages: Message[]
}

export function TicketChatView({ticket, initialMessages}: TicketChatViewProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentTicket, setCurrentTicket] = useState(ticket)

    // Référence pour l'auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null)

    /**
     * Auto-scroll vers le bas quand de nouveaux messages arrivent
     * Comportement smooth pour une meilleure UX
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    /**
     * Polling toutes les 3 secondes pour charger les nouveaux messages
     * Plus rapides que côté client, car SuperAdmin doit répondre vite
     */
    useEffect(() => {
        const interval = setInterval(async () => {
            const result = await getTicketMessages(ticket.id)
            if (result.success && result.messages) {
                setMessages(result.messages)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [ticket.id])

    /**
     * Gestion de l'envoi de message
     * Validation : message non vide
     * Feedback immédiat : loading state + toast
     */
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isLoading) return

        setIsLoading(true)

        try {
            const result = await sendAdminMessage({
                ticketId: ticket.id,
                message: newMessage
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                // Réinitialiser le champ
                setNewMessage('')

                // Recharger les messages immédiatement
                const messagesResult = await getTicketMessages(ticket.id)
                if (messagesResult.success && messagesResult.messages) {
                    setMessages(messagesResult.messages)
                }

                toast.success('Message envoyé')
            }
        } catch (error) {
            toast.error('Erreur lors de l\'envoi')
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Callback pour mettre à jour le ticket après une action rapide
     * (changement statut, priorité, etc.)
     */
    const handleTicketUpdate = (updatedTicket: Partial<SupportTicket>) => {
        setCurrentTicket({...currentTicket, ...updatedTicket} as TicketWithRelations)
    }

    /**
     * Gestion du raccourci clavier Entrée pour envoyer
     * Maj+Entrée pour nouvelle ligne (comportement naturel)
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage(e)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Colonne principale : Conversation */}
            <div className="lg:col-span-2 flex flex-col">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    {/* Header avec infos ticket */}
                    <div className="p-4 border-b bg-gray-50">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="font-semibold text-lg">{currentTicket.subject}</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Restaurant : {currentTicket.restaurant.name}
                                </p>
                            </div>
                            <TicketQuickActions
                                ticket={currentTicket}
                                onUpdate={handleTicketUpdate}
                            />
                        </div>
                    </div>

                    {/* Liste des messages avec scroll */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <TicketMessageList messages={messages}/>
                        {/* Élément invisible pour l'auto-scroll */}
                        <div ref={messagesEndRef}/>
                    </div>

                    {/* Alert si ticket fermé */}
                    {(currentTicket.status === 'closed' || currentTicket.status === 'resolved') && (
                        <div className="px-4 pb-2">
                            <Alert>
                                <AlertCircle className="h-4 w-4"/>
                                <AlertDescription>
                                    Ce ticket est {currentTicket.status === 'closed' ? 'fermé' : 'résolu'}.
                                    Vous pouvez toujours envoyer un message pour le réouvrir.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Zone de saisie */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
                        <div className="flex gap-2">
                            <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tapez votre réponse... (Entrée pour envoyer)"
                                rows={3}
                                className="resize-none bg-white"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isLoading || !newMessage.trim()}
                                className="bg-blue-600 hover:bg-blue-700 h-auto"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                ) : (
                                    <Send className="h-5 w-5"/>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Astuce : Entrée pour envoyer, Maj+Entrée pour nouvelle ligne
                        </p>
                    </form>
                </Card>
            </div>

            {/* Sidebar : Informations contextuelles */}
            <div className="lg:col-span-1">
                <TicketInfoSidebar ticket={currentTicket}/>
            </div>
        </div>
    )
}
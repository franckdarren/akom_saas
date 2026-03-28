'use client'

import {useState, useEffect, useRef} from 'react'
import {Send, AlertCircle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {LoadingButton} from '@/components/ui/loading-button'
import {Textarea} from '@/components/ui/textarea'
import {Card} from '@/components/ui/card'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {sendAdminMessage, getTicketMessages} from '@/lib/actions/support'
import {toast} from 'sonner'
import {TicketMessageList} from './TicketMessageList'
import {TicketQuickActions} from './TicketQuickActions'
import {TicketInfoSidebar} from './TicketInfoSidebar'
import type {SupportTicket} from '@prisma/client'

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
        email: string | null
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

export function TicketChatView({
                                   ticket,
                                   initialMessages,
                               }: TicketChatViewProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentTicket, setCurrentTicket] =
        useState<TicketWithRelations>(ticket)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const isTypingRef = useRef(false)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        let pollingInterval: NodeJS.Timeout

        const pollMessages = async () => {
            if (isTypingRef.current) return

            try {
                const result = await getTicketMessages(ticket.id)
                if (result.success && result.messages) {
                    if (result.messages.length !== messages.length) {
                        setMessages(result.messages)
                    }
                }
            } catch (error) {
                console.error('Erreur lors du polling des messages:', error)
            }
        }

        const initialDelay = setTimeout(() => {
            pollingInterval = setInterval(pollMessages, 5000)
        }, 3000)

        return () => {
            clearTimeout(initialDelay)
            if (pollingInterval) clearInterval(pollingInterval)
        }
    }, [ticket.id, messages.length])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isLoading) return

        setIsLoading(true)

        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            message: newMessage,
            isAdmin: true,
            createdAt: new Date(),
            userId: currentTicket.userId,
        }

        const previousMessages = messages
        setMessages([...messages, tempMessage])
        setNewMessage('')

        try {
            const result = await sendAdminMessage({
                ticketId: ticket.id,
                message: newMessage,
            })

            if (result.error) {
                setMessages(previousMessages)
                setNewMessage(tempMessage.message)
                toast.error(result.error)
            } else {
                const messagesResult = await getTicketMessages(ticket.id)
                if (messagesResult.success && messagesResult.messages) {
                    setMessages(messagesResult.messages)
                }
                toast.success('Message envoyé')
            }
        } catch (error) {
            setMessages(previousMessages)
            setNewMessage(tempMessage.message)
            toast.error("Erreur lors de l'envoi")
        } finally {
            setIsLoading(false)
        }
    }

    const handleTicketUpdate = (updatedTicket: Partial<SupportTicket>) => {
        setCurrentTicket({
            ...currentTicket,
            ...updatedTicket,
        } as TicketWithRelations)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage(e)
        }
    }

    const handleTextareaChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        setNewMessage(e.target.value)
        isTypingRef.current = true
        setTimeout(() => {
            isTypingRef.current = false
        }, 2000)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">

            {/* Conversation */}
            <div className="lg:col-span-2 flex flex-col">
                <Card className="flex-1 flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="p-4 border-b bg-muted/40">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="font-semibold text-lg">
                                    {currentTicket.subject}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Restaurant : {currentTicket.restaurant.name}
                                </p>
                            </div>

                            <TicketQuickActions
                                ticket={currentTicket}
                                onUpdate={handleTicketUpdate}
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <TicketMessageList messages={messages}/>
                        <div ref={messagesEndRef}/>
                    </div>

                    {/* Alert si fermé */}
                    {(currentTicket.status === 'closed' ||
                        currentTicket.status === 'resolved') && (
                        <div className="px-4 pb-2">
                            <Alert variant="default">
                                <AlertCircle className="h-4 w-4"/>
                                <AlertDescription>
                                    Ce ticket est{' '}
                                    {currentTicket.status === 'closed'
                                        ? 'fermé'
                                        : 'résolu'}
                                    . Vous pouvez toujours envoyer un message pour le
                                    réouvrir.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Input */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-4 border-t bg-muted/40"
                    >
                        <div className="flex gap-2">
                            <Textarea
                                value={newMessage}
                                onChange={handleTextareaChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Tapez votre réponse... (Entrée pour envoyer)"
                                rows={3}
                                className="resize-none"
                                disabled={isLoading}
                            />

                            <LoadingButton
                                type="submit"
                                size="icon"
                                isLoading={isLoading}
                                disabled={!newMessage.trim()}
                                icon={<Send className="h-5 w-5" />}
                            />
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                            💡 Astuce : Entrée pour envoyer, Maj+Entrée pour nouvelle ligne
                        </p>
                    </form>

                </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
                <TicketInfoSidebar ticket={currentTicket} />
            </div>
        </div>
    )
}

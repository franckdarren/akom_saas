'use client'

import {useState, useEffect, useRef} from 'react'
import {MessageSquare, X, Send, ArrowLeft, Loader2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Textarea} from '@/components/ui/textarea'
import {ScrollArea} from '@/components/ui/scroll-area'
import {cn} from '@/lib/utils'
import {formatDate} from '@/lib/utils/format'
import {createSupportTicket, sendTicketMessage, getMyTickets, getTicketMessages} from '@/lib/actions/support'

interface Ticket {
    description: string
    id: string
    subject: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    createdAt: Date
    _count: { messages: number }
}

interface Message {
    id: string
    message: string
    isAdmin: boolean
    createdAt: Date
}

export function FloatingSupportButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNewTicketForm, setShowNewTicketForm] = useState(false)
    const [isTicketsLoading, setIsTicketsLoading] = useState(false)
    const [isMessagesLoading, setIsMessagesLoading] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
    })

    // Auto scroll sur le dernier message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Focus textarea quand conversation ouverte
    useEffect(() => {
        if (selectedTicket && textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [selectedTicket])

    // Charger les tickets à l'ouverture
    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability
        if (isOpen && !selectedTicket) loadTickets()
    }, [isOpen, selectedTicket])

    // Charger les messages quand un ticket est sélectionné
    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability
        if (selectedTicket) loadMessages(selectedTicket)
    }, [selectedTicket])

    const loadTickets = async () => {
        setIsTicketsLoading(true)
        const result = await getMyTickets()
        if (result.success && result.tickets) setTickets(result.tickets)
        setIsTicketsLoading(false)
    }

    const loadMessages = async (ticketId: string) => {
        setIsMessagesLoading(true)
        const result = await getTicketMessages(ticketId)
        if (result.success && result.messages) setMessages(result.messages)
        setIsMessagesLoading(false)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedTicket) return

        setIsLoading(true)
        const result = await sendTicketMessage({ticketId: selectedTicket, message: newMessage})

        if (result.error) alert(result.error)
        else {
            setNewMessage('')
            loadMessages(selectedTicket)
        }

        setIsLoading(false)
    }

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const result = await createSupportTicket(newTicket)

        if (result.error) alert(result.error)
        else {
            alert('Ticket créé avec succès')
            setShowNewTicketForm(false)
            setNewTicket({subject: '', description: '', priority: 'medium'})
            loadTickets()
        }

        setIsLoading(false)
    }

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
        <>
            {/* Floating Button */}
            <Button
                onClick={() => setIsOpen(true)}
                size="icon"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:opacity-90 z-50"
            >
                {unreadCount > 0 && (
                    <Badge
                        className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center bg-destructive text-destructive-foreground animate-pulse">
                        {unreadCount}
                    </Badge>
                )}
                <MessageSquare className="h-6 w-6"/>
            </Button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 w-[400px] max-w-[95vw] h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">

                    {/* HEADER (fixe) */}
                    <div
                        className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted shrink-0">
                        <div className="flex items-center gap-2 font-semibold">
                            {selectedTicket && (
                                <ArrowLeft
                                    className="h-4 w-4 cursor-pointer"
                                    onClick={() => setSelectedTicket(null)}
                                />
                            )}
                            {selectedTicket ? 'Conversation' : 'Support'}
                        </div>
                        <X className="h-4 w-4 cursor-pointer" onClick={() => setIsOpen(false)}/>
                    </div>

                    {/* BODY */}
                    <div className="flex-1 flex flex-col min-h-0">

                        {!selectedTicket ? (
                            <>
                                {/* Bouton nouveau ticket */}
                                <div className="p-4 shrink-0">
                                    <Button
                                        onClick={() => setShowNewTicketForm(true)}
                                        className="w-full"
                                    >
                                        Nouveau ticket
                                    </Button>
                                </div>

                                {/* LISTE SCROLLABLE */}
                                <ScrollArea className="flex-1 min-h-0 px-2">
                                    <div className="pb-4">
                                        {tickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                onClick={() => setSelectedTicket(ticket.id)}
                                                className="p-3 rounded-lg hover:bg-accent cursor-pointer transition border mb-2"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="font-medium text-sm">
                                                        {ticket.subject}
                                                    </div>
                                                    {getStatusBadge(ticket.status)}
                                                </div>

                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {ticket._count.messages} messages •{" "}
                                                    {formatDate(ticket.createdAt)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </>
                        ) : (
                            <>
                                {/* MESSAGES SCROLLABLE */}
                                <ScrollArea className="flex-1 min-h-0 px-4 py-3">
                                    <div className="space-y-4 pb-4">

                                        {/* Card ticket */}
                                        {tickets
                                            .filter((t) => t.id === selectedTicket)
                                            .map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    className="p-3 rounded-lg border bg-accent/30"
                                                >
                                                    <div className="flex justify-between mb-2">
                                                        <div className="font-semibold text-sm">
                                                            {ticket.subject}
                                                        </div>
                                                        {getStatusBadge(ticket.status)}
                                                    </div>

                                                    <p className="text-sm whitespace-pre-wrap mb-3">
                                                        {ticket.description}
                                                    </p>

                                                    <div className="text-xs text-muted-foreground">
                                                        {/*{ticket._count.messages} message*/}
                                                        {/*{ticket._count.messages > 1 ? "s" : ""} •{" "}*/}
                                                        {formatDate(ticket.createdAt)}
                                                    </div>
                                                </div>
                                            ))}

                                        {/* Messages */}
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={cn(
                                                    "flex",
                                                    message.isAdmin ? "justify-start" : "justify-end"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                                                        message.isAdmin
                                                            ? "bg-muted"
                                                            : "bg-primary text-primary-foreground"
                                                    )}
                                                >
                                                    {message.isAdmin && (
                                                        <div className="text-xs font-semibold text-blue-600 mb-1">
                                                            Support Akôm
                                                        </div>
                                                    )}
                                                    {message.message}
                                                    <div className="text-[10px] opacity-60 mt-1">
                                                        {formatDate(message.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                </ScrollArea>

                                {/* INPUT FIXE */}
                                <form
                                    onSubmit={handleSendMessage}
                                    className="p-3 border-t border-border flex gap-2 shrink-0"
                                >
                                    <Textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Votre message..."
                                        className="resize-none"
                                        rows={2}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!newMessage.trim() || isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin"/>
                                        ) : (
                                            <Send className="h-4 w-4"/>
                                        )}
                                    </Button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

        </>
    )
}

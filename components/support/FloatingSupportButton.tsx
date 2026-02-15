'use client'

import {useState, useEffect, useRef} from 'react'
import {MessageSquare, X, Send, Loader2, ArrowLeft} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Textarea} from '@/components/ui/textarea'
import {ScrollArea} from '@/components/ui/scroll-area'
import {createSupportTicket, sendTicketMessage, getMyTickets, getTicketMessages} from '@/lib/actions/support'
import {toast} from 'sonner'
import {cn} from '@/lib/utils'
import {formatDate} from '@/lib/utils/format'

interface Ticket {
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

    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
    })

    // ----- Auto scroll -----
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages])

    // ----- Focus textarea -----
    useEffect(() => {
        if (selectedTicket && textareaRef.current) textareaRef.current.focus()
    }, [selectedTicket])

    // ----- Load tickets when modal opens -----
    useEffect(() => {
        if (isOpen && !selectedTicket) {
            loadTickets()
            checkUnreadMessages()
        }
    }, [isOpen, selectedTicket])

    // ----- Polling messages every 5s for selected ticket -----
    useEffect(() => {
        if (!selectedTicket) return
        loadMessages(selectedTicket)
        const interval = setInterval(() => loadMessages(selectedTicket), 5000)
        return () => clearInterval(interval)
    }, [selectedTicket])

    const loadTickets = async () => {
        try {
            const result = await getMyTickets()
            if (result.success && result.tickets) setTickets(result.tickets)
        } catch (e) {
            console.error(e)
        }
    }

    const loadMessages = async (ticketId: string) => {
        try {
            const result = await getTicketMessages(ticketId)
            if (result.success && result.messages) setMessages(result.messages)
        } catch (e) {
            console.error(e)
        }
    }

    const checkUnreadMessages = async () => {
        try {
            const result = await getMyTickets()
            if (result.success && result.tickets) {
                const openTickets = result.tickets.filter(t => t.status === 'open' || t.status === 'in_progress')
                setUnreadCount(openTickets.length)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedTicket) return

        setIsLoading(true)
        try {
            const result = await sendTicketMessage({ticketId: selectedTicket, message: newMessage})
            if (result.error) toast.error(result.error)
            else {
                setNewMessage('')
                loadMessages(selectedTicket)
            }
        } catch (e) {
            toast.error('Erreur lors de l’envoi du message')
        }
        setIsLoading(false)
    }

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTicket.subject.trim() || !newTicket.description.trim()) return
        setIsLoading(true)
        try {
            const result = await createSupportTicket(newTicket)
            if (result.error) toast.error(result.error)
            else {
                toast.success('Ticket créé avec succès')
                setShowNewTicketForm(false)
                setNewTicket({subject: '', description: '', priority: 'medium'})
                loadTickets()
            }
        } catch (e) {
            toast.error('Erreur lors de la création du ticket')
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
        return <Badge
            className={cn('text-white', variants[status as keyof typeof variants])}>{labels[status as keyof typeof labels]}</Badge>
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
        return <Badge
            className={cn('text-white', variants[priority as keyof typeof variants])}>{labels[priority as keyof typeof labels]}</Badge>
    }

    return (
        <>
            {/* Floating Button */}
            <div>
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
            </div>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed bottom-6 right-6 w-[400px] max-w-[95vw] max-h-[calc(100vh-48px)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
                        <div className="flex items-center gap-2 font-semibold">
                            {selectedTicket && (
                                <ArrowLeft className="h-4 w-4 cursor-pointer" onClick={() => setSelectedTicket(null)}/>
                            )}
                            {selectedTicket ? 'Conversation' : 'Support'}
                        </div>
                        <X className="h-4 w-4 cursor-pointer" onClick={() => setIsOpen(false)}/>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                        {!selectedTicket ? (
                            <>
                                <div className="p-4">
                                    <Button onClick={() => setShowNewTicketForm(true)} className="w-full">
                                        Nouveau ticket
                                    </Button>
                                </div>

                                {showNewTicketForm ? (
                                    <ScrollArea className="flex-1 p-4">
                                        <form onSubmit={handleCreateTicket} className="space-y-4">
                                            <div>
                                                <label>Sujet *</label>
                                                <input
                                                    className="w-full border p-2 rounded"
                                                    value={newTicket.subject}
                                                    onChange={e => setNewTicket({
                                                        ...newTicket,
                                                        subject: e.target.value
                                                    })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label>Description *</label>
                                                <Textarea
                                                    value={newTicket.description}
                                                    onChange={e => setNewTicket({
                                                        ...newTicket,
                                                        description: e.target.value
                                                    })}
                                                    rows={4}
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Créer'}
                                            </Button>
                                        </form>
                                    </ScrollArea>
                                ) : (
                                    <ScrollArea className="flex-1 px-2">
                                        {tickets.map(ticket => (
                                            <div
                                                key={ticket.id}
                                                onClick={() => setSelectedTicket(ticket.id)}
                                                className="p-3 rounded-lg hover:bg-accent cursor-pointer transition"
                                            >
                                                <div className="font-medium text-sm">{ticket.subject}</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {getStatusBadge(ticket.status)} • {getPriorityBadge(ticket.priority)} •{' '}
                                                    {ticket._count.messages} messages • {formatDate(ticket.createdAt)}
                                                </div>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                )}
                            </>
                        ) : (
                            <>
                                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                                    {messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={cn('flex', message.isAdmin ? 'justify-start' : 'justify-end')}
                                        >
                                            <div
                                                className={cn(
                                                    'max-w-[75%] px-4 py-2 rounded-2xl text-sm',
                                                    message.isAdmin ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
                                                )}
                                            >
                                                {message.message}
                                                <div
                                                    className="text-[10px] opacity-60 mt-1">{formatDate(message.createdAt)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2">
                                    <Textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Votre message..."
                                        className="resize-none"
                                        rows={2}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendMessage(e)
                                            }
                                        }}
                                    />
                                    <Button type="submit" size="icon" disabled={!newMessage.trim() || isLoading}>
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                            <Send className="h-4 w-4"/>}
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

'use client'

import {useState, useEffect, useRef} from 'react'
import {MessageSquare, X, Send, ArrowLeft, Loader2, Plus} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Textarea} from '@/components/ui/textarea'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {ScrollArea} from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {cn} from '@/lib/utils'
import {formatDate} from '@/lib/utils/format'
import {
    createSupportTicket,
    sendTicketMessage,
    getMyTickets,
    getTicketMessages,
} from '@/lib/actions/support'

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

// Vue active du panel
type View = 'list' | 'conversation' | 'new-ticket'

export function FloatingSupportButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState<View>('list')
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isTicketsLoading, setIsTicketsLoading] = useState(false)
    const [isMessagesLoading, setIsMessagesLoading] = useState(false)

    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    })

    // Auto scroll bas
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Focus textarea à l'ouverture de la conversation
    useEffect(() => {
        if (view === 'conversation' && textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [view])

    // Charger tickets quand la liste est affichée
    useEffect(() => {
        if (isOpen && view === 'list') loadTickets()
    }, [isOpen, view])

    // Charger messages quand un ticket est sélectionné
    useEffect(() => {
        if (selectedTicket && view === 'conversation') loadMessages(selectedTicket)
    }, [selectedTicket, view])

    const loadTickets = async () => {
        setIsTicketsLoading(true)
        const result = await getMyTickets()
        if (result.success && result.tickets) setTickets(result.tickets as Ticket[])
        setIsTicketsLoading(false)
    }

    const loadMessages = async (ticketId: string) => {
        setIsMessagesLoading(true)
        const result = await getTicketMessages(ticketId)
        if (result.success && result.messages) setMessages(result.messages as Message[])
        setIsMessagesLoading(false)
    }

    const handleSelectTicket = (ticketId: string) => {
        setSelectedTicket(ticketId)
        setMessages([])
        setView('conversation')
    }

    // ✅ Retour arrière universel
    const handleBack = () => {
        setSelectedTicket(null)
        setMessages([])
        setNewTicket({subject: '', description: '', priority: 'medium'})
        setView('list')
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedTicket) return

        setIsLoading(true)
        const result = await sendTicketMessage({
            ticketId: selectedTicket,
            message: newMessage,
        })

        if (result.error) {
            alert(result.error)
        } else {
            setNewMessage('')
            loadMessages(selectedTicket)
        }
        setIsLoading(false)
    }

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTicket.subject.trim() || !newTicket.description.trim()) return

        setIsLoading(true)
        const result = await createSupportTicket(newTicket)

        if (result.error) {
            alert(result.error)
        } else {
            setNewTicket({subject: '', description: '', priority: 'medium'})
            setView('list')
            loadTickets()
        }
        setIsLoading(false)
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            open: 'bg-blue-500',
            in_progress: 'bg-yellow-500',
            resolved: 'bg-green-500',
            closed: 'bg-gray-500',
        }
        const labels: Record<string, string> = {
            open: 'Ouvert',
            in_progress: 'En cours',
            resolved: 'Résolu',
            closed: 'Fermé',
        }
        return (
            <Badge className={cn('text-white text-xs', variants[status])}>
                {labels[status]}
            </Badge>
        )
    }

    const headerTitle: Record<View, string> = {
        list: 'Support',
        conversation: 'Conversation',
        'new-ticket': 'Nouveau ticket',
    }

    return (
        <>
            {/* ====== Bouton flottant ====== */}
            <Button
                onClick={() => setIsOpen(true)}
                size="icon"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:opacity-90 z-50"
            >
                <MessageSquare className="h-6 w-6"/>
            </Button>

            {/* ====== Panel ====== */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 w-[400px] max-w-[95vw] h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">

                    {/* HEADER */}
                    <div
                        className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted shrink-0">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                            {view !== 'list' && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="p-1 rounded hover:bg-accent transition"
                                >
                                    <ArrowLeft className="h-4 w-4"/>
                                </button>
                            )}
                            {headerTitle[view]}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded hover:bg-accent transition"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="flex-1 flex flex-col min-h-0">

                        {/* ===================== VUE : LISTE ===================== */}
                        {view === 'list' && (
                            <>
                                <div className="p-4 shrink-0">
                                    {/* ✅ onClick passe bien à 'new-ticket' */}
                                    <Button
                                        type="button"
                                        onClick={() => setView('new-ticket')}
                                        className="w-full"
                                        size="sm"
                                    >
                                        <Plus className="h-4 w-4 mr-2"/>
                                        Nouveau ticket
                                    </Button>
                                </div>

                                <ScrollArea className="flex-1 min-h-0 px-3">
                                    {isTicketsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                                        </div>
                                    ) : tickets.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-muted-foreground">
                                            Aucun ticket pour le moment
                                        </div>
                                    ) : (
                                        <div className="pb-4 space-y-2">
                                            {tickets.map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    onClick={() => handleSelectTicket(ticket.id)}
                                                    className="p-3 rounded-lg hover:bg-accent cursor-pointer transition border"
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="font-medium text-sm leading-tight">
                                                            {ticket.subject}
                                                        </div>
                                                        {getStatusBadge(ticket.status)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {ticket._count.messages} message
                                                        {ticket._count.messages > 1 ? 's' : ''} ·{' '}
                                                        {formatDate(ticket.createdAt)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </>
                        )}

                        {/* ===================== VUE : NOUVEAU TICKET ===================== */}
                        {/* ✅ Ce bloc était manquant — il n'était jamais rendu */}
                        {view === 'new-ticket' && (
                            <form
                                onSubmit={handleCreateTicket}
                                className="flex flex-col flex-1 min-h-0"
                            >
                                <ScrollArea className="flex-1 min-h-0">
                                    <div className="p-4 space-y-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="subject">Sujet *</Label>
                                            <Input
                                                id="subject"
                                                placeholder="Ex: Problème avec les commandes"
                                                value={newTicket.subject}
                                                onChange={(e) =>
                                                    setNewTicket((p) => ({...p, subject: e.target.value}))
                                                }
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label>Priorité</Label>
                                            <Select
                                                value={newTicket.priority}
                                                onValueChange={(v) =>
                                                    setNewTicket((p) => ({
                                                        ...p,
                                                        priority: v as typeof newTicket.priority,
                                                    }))
                                                }
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Basse</SelectItem>
                                                    <SelectItem value="medium">Moyenne</SelectItem>
                                                    <SelectItem value="high">Haute</SelectItem>
                                                    <SelectItem value="urgent">Urgente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="description">Description *</Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Décrivez votre problème en détail..."
                                                value={newTicket.description}
                                                onChange={(e) =>
                                                    setNewTicket((p) => ({...p, description: e.target.value}))
                                                }
                                                rows={6}
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>
                                    </div>
                                </ScrollArea>

                                <div className="p-4 border-t border-border shrink-0">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                            isLoading ||
                                            !newTicket.subject.trim() ||
                                            !newTicket.description.trim()
                                        }
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Envoi en cours...
                                            </>
                                        ) : (
                                            'Envoyer le ticket'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* ===================== VUE : CONVERSATION ===================== */}
                        {view === 'conversation' && (
                            <>
                                <ScrollArea className="flex-1 min-h-0 px-4 py-3">
                                    <div className="space-y-4 pb-4">
                                        {/* Récap ticket */}
                                        {tickets
                                            .filter((t) => t.id === selectedTicket)
                                            .map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    className="p-3 rounded-lg border bg-accent/30"
                                                >
                                                    <div className="flex justify-between items-start mb-2 gap-2">
                                                        <div className="font-semibold text-sm leading-tight">
                                                            {ticket.subject}
                                                        </div>
                                                        {getStatusBadge(ticket.status)}
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap mb-2">
                                                        {ticket.description}
                                                    </p>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatDate(ticket.createdAt)}
                                                    </div>
                                                </div>
                                            ))}

                                        {/* Messages */}
                                        {isMessagesLoading ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-center text-sm text-muted-foreground py-4">
                                                Aucun message pour le moment
                                            </div>
                                        ) : (
                                            messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={cn(
                                                        'flex',
                                                        message.isAdmin ? 'justify-start' : 'justify-end'
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            'max-w-[75%] px-4 py-2 rounded-2xl text-sm',
                                                            message.isAdmin
                                                                ? 'bg-muted'
                                                                : 'bg-primary text-primary-foreground'
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
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* Input message */}
                                <form
                                    onSubmit={handleSendMessage}
                                    className="p-3 border-t border-border flex gap-2 shrink-0"
                                >
                                    <Textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSendMessage(e as any)
                                            }
                                        }}
                                        placeholder="Votre message... (Entrée pour envoyer)"
                                        className="resize-none"
                                        rows={2}
                                        disabled={isLoading}
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
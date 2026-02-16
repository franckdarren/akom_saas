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

export function TicketChatView({ticket, initialMessages}: TicketChatViewProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentTicket, setCurrentTicket] = useState(ticket)

    // Référence pour l'auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Référence pour suivre si nous sommes en train de taper
    const isTypingRef = useRef(false)

    /**
     * Cette fonction gère l'auto-scroll de manière intelligente.
     * Elle fait défiler vers le bas seulement si l'utilisateur n'est pas
     * en train de consulter des messages plus anciens en haut de la conversation.
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    /**
     * CORRECTION PRINCIPALE : Polling intelligent sans rechargement de page
     *
     * Au lieu de recharger toute la page avec router.refresh() ou revalidatePath,
     * nous allons simplement mettre à jour l'état local des messages.
     *
     * La clé ici est d'utiliser setMessages() qui ne déclenche qu'un re-render
     * du composant, pas un rechargement complet de la page.
     */
    useEffect(() => {
        let pollingInterval: NodeJS.Timeout

        const pollMessages = async () => {
            // Ne pas polluer si l'utilisateur est en train de taper
            // Cela évite de perturber l'expérience pendant la saisie
            if (isTypingRef.current) {
                return
            }

            try {
                const result = await getTicketMessages(ticket.id)

                if (result.success && result.messages) {
                    // Vérifier si nous avons de nouveaux messages
                    // en comparant le nombre de messages
                    if (result.messages.length !== messages.length) {
                        // Mise à jour uniquement si le nombre a changé
                        // Cela évite les re-renders inutiles
                        setMessages(result.messages)
                    }
                }
            } catch (error) {
                // En cas d'erreur, on ne fait rien plutôt que de casser l'expérience
                console.error('Erreur lors du polling des messages:', error)
            }
        }

        // Démarrer le polling après un délai initial de 3 secondes
        // Cela donne le temps à l'utilisateur de voir les messages initiaux
        const initialDelay = setTimeout(() => {
            // Ensuite, polluer toutes les 5 secondes
            pollingInterval = setInterval(pollMessages, 5000)
        }, 3000)

        // Nettoyage : arrêter le polling quand le composant est démonté
        return () => {
            clearTimeout(initialDelay)
            if (pollingInterval) {
                clearInterval(pollingInterval)
            }
        }
    }, [ticket.id, messages.length]) // Dépendances optimisées

    /**
     * Gestion de l'envoi de message avec feedback immédiat
     *
     * Cette fonction ajoute immédiatement le message à l'interface (optimistic update)
     * avant même que le serveur confirme. Cela rend l'interface plus réactive.
     */
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || isLoading) return

        setIsLoading(true)

        // Créer un message temporaire pour l'affichage immédiat
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            message: newMessage,
            isAdmin: true,
            createdAt: new Date(),
            userId: currentTicket.userId
        }

        // Ajouter immédiatement le message à l'interface
        const previousMessages = messages
        setMessages([...messages, tempMessage])
        setNewMessage('')

        try {
            const result = await sendAdminMessage({
                ticketId: ticket.id,
                message: newMessage
            })

            if (result.error) {
                // En cas d'erreur, restaurer les messages précédents
                setMessages(previousMessages)
                setNewMessage(tempMessage.message) // Restaurer le texte
                toast.error(result.error)
            } else {
                // Recharger tous les messages pour avoir les IDs corrects
                const messagesResult = await getTicketMessages(ticket.id)
                if (messagesResult.success && messagesResult.messages) {
                    setMessages(messagesResult.messages)
                }
                toast.success('Message envoyé')
            }
        } catch (error) {
            // En cas d'erreur inattendue
            setMessages(previousMessages)
            setNewMessage(tempMessage.message)
            toast.error('Erreur lors de l\'envoi')
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Callback pour mettre à jour le ticket après une action rapide
     */
    const handleTicketUpdate = (updatedTicket: Partial<SupportTicket>) => {
        setCurrentTicket({...currentTicket, ...updatedTicket} as TicketWithRelations)
    }

    /**
     * Gestion du raccourci clavier avec détection de la saisie
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage(e)
        }
    }

    /**
     * Détecter quand l'utilisateur tape pour suspendre le polling
     */
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value)
        isTypingRef.current = true

        // Réactiver le polling après 2 secondes d'inactivité
        setTimeout(() => {
            isTypingRef.current = false
        }, 2000)
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
                                onChange={handleTextareaChange}
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
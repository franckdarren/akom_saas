'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {isSuperAdminEmail} from '@/lib/utils/permissions'
import type {TicketStatus, TicketPriority} from '@prisma/client'

// ============================================================
// HELPERS
// ============================================================

async function getCurrentUser() {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')
    return user
}

export async function verifySuperAdmin() {
    const user = await getCurrentUser()
    if (!isSuperAdminEmail(user.email || '')) {
        throw new Error('Accès refusé : SuperAdmin uniquement')
    }
    return user
}

// ============================================================
// ACTIONS DE GESTION
// ============================================================

export async function createSupportTicket(data: {
    subject: string
    description: string
    priority?: TicketPriority
}) {
    try {
        const user = await getCurrentUser()
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: {userId: user.id},
        })

        if (!restaurantUser) return {error: 'Aucun restaurant trouvé'}

        const ticket = await prisma.supportTicket.create({
            data: {
                restaurantId: restaurantUser.restaurantId,
                userId: user.id,
                subject: data.subject,
                description: data.description,
                priority: data.priority || 'medium',
                status: 'open',
            },
        })

        revalidatePath('/dashboard/support')
        return {success: true, ticket}
    } catch (error) {
        return {error: 'Erreur lors de la création du ticket'}
    }
}

export async function getAllTickets(status?: TicketStatus) {
    await verifySuperAdmin()

    // On récupère tout et on trie par priorité logique (Urgent > High > Medium > Low)
    const tickets = await prisma.supportTicket.findMany({
        where: status ? {status} : undefined,
        include: {
            restaurant: {select: {name: true}},
            _count: {select: {messages: true}},
        },
        orderBy: {createdAt: 'desc'},
    })

    const priorityWeight = {urgent: 0, high: 1, medium: 2, low: 3}
    return tickets.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority])
}

// ... (getTicketDetails, addTicketMessage, updateTicketStatus restent identiques)

// ============================================================
// STATISTIQUES (LA MEILLEURE MÉTHODE : SQL RAW)
// ============================================================

export async function getSupportStats() {
    await verifySuperAdmin()

    try {
        /**
         * On utilise une seule requête SQL pour tout calculer d'un coup.
         * EXTRACT(EPOCH FROM ...) donne la différence en secondes.
         * On divise par 3600 pour avoir des heures.
         */
        const stats = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = 'open')::int as open,
                COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
                COUNT(*) FILTER (WHERE status = 'resolved')::int as resolved,
                COALESCE(
                    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) 
                    FILTER (WHERE status = 'resolved' AND resolved_at IS NOT NULL), 
                    0
                )::float as avg_hours
            FROM support_tickets
        `

        const result = stats[0]

        return {
            total: result.total || 0,
            open: result.open || 0,
            inProgress: result.in_progress || 0,
            resolved: result.resolved || 0,
            avgResolutionTime: Number(result.avg_hours.toFixed(1))
        }
    } catch (error) {
        console.error("Erreur stats SQL:", error)
        // Fallback vide pour éviter de faire planter la page
        return {total: 0, open: 0, inProgress: 0, resolved: 0, avgResolutionTime: 0}
    }
}

// ============================================================
// ACTIONS CLIENT (Restaurant Admin)
// ============================================================

export async function getMyTickets() {
    try {
        const user = await getCurrentUser()
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: {userId: user.id},
        })

        if (!restaurantUser) return {error: 'Aucun restaurant trouvé'}

        const tickets = await prisma.supportTicket.findMany({
            where: {
                restaurantId: restaurantUser.restaurantId
            },
            include: {
                _count: {
                    select: {messages: true}
                }
            },
            orderBy: {createdAt: 'desc'}
        })

        return {success: true, tickets}
    } catch (error) {
        return {error: 'Erreur lors du chargement des tickets'}
    }
}

export async function getTicketMessages(ticketId: string) {
    try {
        const user = await getCurrentUser()
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: {userId: user.id},
        })

        if (!restaurantUser) return {error: 'Accès refusé'}

        // Vérifier que le ticket appartient bien au restaurant
        const ticket = await prisma.supportTicket.findFirst({
            where: {
                id: ticketId,
                restaurantId: restaurantUser.restaurantId
            }
        })

        if (!ticket) return {error: 'Ticket introuvable'}

        const messages = await prisma.ticketMessage.findMany({
            where: {ticketId},
            orderBy: {createdAt: 'asc'}
        })

        return {success: true, messages}
    } catch (error) {
        return {error: 'Erreur lors du chargement des messages'}
    }
}

export async function sendTicketMessage(data: {
    ticketId: string
    message: string
}) {
    try {
        const user = await getCurrentUser()
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: {userId: user.id},
        })

        if (!restaurantUser) return {error: 'Accès refusé'}

        // Vérifier que le ticket appartient au restaurant
        const ticket = await prisma.supportTicket.findFirst({
            where: {
                id: data.ticketId,
                restaurantId: restaurantUser.restaurantId
            }
        })

        if (!ticket) return {error: 'Ticket introuvable'}

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId: data.ticketId,
                userId: user.id,
                message: data.message,
                isAdmin: false
            }
        })

        // Mettre à jour le statut du ticket si nécessaire
        if (ticket.status === 'resolved' || ticket.status === 'closed') {
            await prisma.supportTicket.update({
                where: {id: data.ticketId},
                data: {status: 'open'}
            })
        }

        revalidatePath('/superadmin/support')
        return {success: true, message}
    } catch (error) {
        return {error: 'Erreur lors de l\'envoi du message'}
    }
}

// ============================================================
// ACTIONS SUPERADMIN (pour les notifications)
// ============================================================

export async function getUnreadTicketsCount() {
    try {
        await verifySuperAdmin()

        const count = await prisma.supportTicket.count({
            where: {
                status: {
                    in: ['open', 'in_progress']
                }
            }
        })

        return {success: true, count}
    } catch (error) {
        return {success: false, count: 0}
    }
}

export async function sendAdminMessage(data: {
    ticketId: string
    message: string
}) {
    try {
        const user = await verifySuperAdmin()

        const message = await prisma.ticketMessage.create({
            data: {
                ticketId: data.ticketId,
                userId: user.id,
                message: data.message,
                isAdmin: true
            }
        })

        // Marquer le ticket comme "en cours" si nécessaire
        await prisma.supportTicket.update({
            where: {id: data.ticketId},
            data: {
                status: 'in_progress',
                updatedAt: new Date()
            }
        })

        revalidatePath('/superadmin/support')
        return {success: true, message}
    } catch (error) {
        return {error: 'Erreur lors de l\'envoi du message'}
    }
}

export async function updateTicketStatus(data: {
    ticketId: string
    status: TicketStatus
}) {
    try {
        await verifySuperAdmin()

        const ticket = await prisma.supportTicket.update({
            where: {id: data.ticketId},
            data: {
                status: data.status,
                resolvedAt: data.status === 'resolved' ? new Date() : null
            }
        })

        revalidatePath('/superadmin/support')
        return {success: true, ticket}
    } catch (error) {
        return {error: 'Erreur lors de la mise à jour du statut'}
    }
}

export async function updateTicketPriority(data: {
    ticketId: string
    priority: TicketPriority
}) {
    try {
        await verifySuperAdmin()

        const ticket = await prisma.supportTicket.update({
            where: {id: data.ticketId},
            data: {priority: data.priority}
        })

        revalidatePath('/superadmin/support')
        return {success: true, ticket}
    } catch (error) {
        return {error: 'Erreur lors de la mise à jour de la priorité'}
    }
}

export async function resolveTicket(ticketId: string) {
    try {
        await verifySuperAdmin()

        const ticket = await prisma.supportTicket.update({
            where: {id: ticketId},
            data: {
                status: 'resolved',
                resolvedAt: new Date()
            }
        })

        revalidatePath('/superadmin/support')
        return {success: true, ticket}
    } catch (error) {
        return {error: 'Erreur lors de la résolution du ticket'}
    }
}

export async function closeTicket(ticketId: string) {
    try {
        await verifySuperAdmin()

        const ticket = await prisma.supportTicket.update({
            where: {id: ticketId},
            data: {status: 'closed'}
        })

        revalidatePath('/superadmin/support')
        return {success: true, ticket}
    } catch (error) {
        return {error: 'Erreur lors de la fermeture du ticket'}
    }
}

export async function getTicketById(ticketId: string) {
    try {
        await verifySuperAdmin()

        const ticket = await prisma.supportTicket.findUnique({
            where: {id: ticketId},
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        // email: true,
                        phone: true
                    }
                },
                _count: {
                    select: {messages: true}
                }
            }
        })

        if (!ticket) return {error: 'Ticket introuvable'}

        return {success: true, ticket}
    } catch (error) {
        return {error: 'Erreur lors du chargement du ticket'}
    }
}
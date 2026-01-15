'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { isSuperAdminEmail } from '@/lib/utils/permissions'

// ============================================================
// TYPES
// ============================================================

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

// ============================================================
// HELPERS
// ============================================================

async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error('Non authentifié')
    }
    
    return user
}

async function verifySuperAdmin() {
    const user = await getCurrentUser()
    
    if (!isSuperAdminEmail(user.email || '')) {
        throw new Error('Accès refusé : SuperAdmin uniquement')
    }
    
    return user
}

// ============================================================
// CRÉER UN TICKET (côté restaurant)
// ============================================================

export async function createSupportTicket(data: {
    subject: string
    description: string
    priority?: TicketPriority
}) {
    try {
        const user = await getCurrentUser()
        
        // Récupérer le restaurant de l'utilisateur
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: { userId: user.id },
        })
        
        if (!restaurantUser) {
            return { error: 'Aucun restaurant trouvé' }
        }
        
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
        return { success: true, ticket }
    } catch (error) {
        console.error('Erreur création ticket:', error)
        return { error: 'Erreur lors de la création du ticket' }
    }
}

// ============================================================
// LISTE DES TICKETS (SuperAdmin)
// ============================================================

export async function getAllTickets(status?: TicketStatus) {
    await verifySuperAdmin()
    
    const tickets = await prisma.supportTicket.findMany({
        where: status ? { status } : undefined,
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            _count: {
                select: {
                    messages: true,
                },
            },
        },
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
        ],
    })
    
    return tickets
}

// ============================================================
// DÉTAILS D'UN TICKET
// ============================================================

export async function getTicketDetails(ticketId: string) {
    const user = await getCurrentUser()
    const isSuperAdmin = isSuperAdminEmail(user.email || '')
    
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            messages: {
                orderBy: { createdAt: 'asc' },
            },
        },
    })
    
    if (!ticket) {
        throw new Error('Ticket introuvable')
    }
    
    // Vérifier les permissions
    if (!isSuperAdmin) {
        const restaurantUser = await prisma.restaurantUser.findFirst({
            where: {
                userId: user.id,
                restaurantId: ticket.restaurantId,
            },
        })
        
        if (!restaurantUser) {
            throw new Error('Accès refusé')
        }
    }
    
    return ticket
}

// ============================================================
// AJOUTER UN MESSAGE
// ============================================================

export async function addTicketMessage(ticketId: string, message: string) {
    try {
        const user = await getCurrentUser()
        const isAdmin = isSuperAdminEmail(user.email || '')
        
        const ticketMessage = await prisma.ticketMessage.create({
            data: {
                ticketId,
                userId: user.id,
                message,
                isAdmin,
            },
        })
        
        // Mettre à jour le ticket
        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { updatedAt: new Date() },
        })
        
        revalidatePath(`/dashboard/support/${ticketId}`)
        revalidatePath('/superadmin/support')
        
        return { success: true, message: ticketMessage }
    } catch (error) {
        console.error('Erreur ajout message:', error)
        return { error: 'Erreur lors de l\'ajout du message' }
    }
}

// ============================================================
// CHANGER LE STATUT
// ============================================================

export async function updateTicketStatus(
    ticketId: string,
    status: TicketStatus
) {
    await verifySuperAdmin()
    
    const ticket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
            status,
            resolvedAt: status === 'resolved' ? new Date() : null,
        },
    })
    
    revalidatePath('/superadmin/support')
    return { success: true, ticket }
}

// ============================================================
// STATISTIQUES SUPPORT
// ============================================================

export async function getSupportStats() {
    await verifySuperAdmin()
    
    const [total, open, inProgress, resolved, avgResponseTime] = await Promise.all([
        prisma.supportTicket.count(),
        
        prisma.supportTicket.count({
            where: { status: 'open' },
        }),
        
        prisma.supportTicket.count({
            where: { status: 'in_progress' },
        }),
        
        prisma.supportTicket.count({
            where: { status: 'resolved' },
        }),
        
        // Temps moyen de résolution (en heures)
        prisma.supportTicket.aggregate({
            where: {
                status: 'resolved',
                resolvedAt: { not: null },
            },
            // _avg: {
            //     // On ne peut pas calculer directement, on le fera côté client
            // },
        }),
    ])
    
    return {
        total,
        open,
        inProgress,
        resolved,
    }
}
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
        console.log('💬 Récupération des messages pour:', ticketId)

        const user = await getCurrentUser()

        // Vérifier si c'est un SuperAdmin
        const isSuperAdmin = isSuperAdminEmail(user.email || '')

        if (isSuperAdmin) {
            /**
             * Le SuperAdmin a un accès complet à tous les tickets
             * sans restriction par restaurant. C'est logique car
             * il doit pouvoir gérer le support de tous les restaurants.
             */
            const messages = await prisma.ticketMessage.findMany({
                where: {ticketId},
                orderBy: {createdAt: 'asc'}
            })

            console.log(`✅ ${messages.length} messages trouvés (accès SuperAdmin)`)
            return {success: true, messages}
        } else {
            /**
             * Pour un utilisateur normal (admin de restaurant),
             * nous devons vérifier qu'il a accès au restaurant
             * auquel appartient ce ticket.
             *
             * Cette vérification protège contre l'accès non autorisé
             * aux tickets d'autres restaurants.
             */
            const restaurantUser = await prisma.restaurantUser.findFirst({
                where: {userId: user.id},
            })

            if (!restaurantUser) {
                return {success: false, error: 'Accès refusé', messages: []}
            }

            // Vérifier que le ticket appartient au restaurant de l'utilisateur
            const ticket = await prisma.supportTicket.findFirst({
                where: {
                    id: ticketId,
                    restaurantId: restaurantUser.restaurantId
                }
            })

            if (!ticket) {
                return {success: false, error: 'Accès refusé', messages: []}
            }

            const messages = await prisma.ticketMessage.findMany({
                where: {ticketId},
                orderBy: {createdAt: 'asc'}
            })

            console.log(`✅ ${messages.length} messages trouvés`)
            return {success: true, messages}
        }
    } catch (error) {
        console.error('❌ Erreur getTicketMessages:', error)
        return {success: false, error: 'Erreur lors du chargement des messages', messages: []}
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

        await prisma.supportTicket.update({
            where: {id: data.ticketId},
            data: {
                status: 'in_progress',
                updatedAt: new Date()
            }
        })

        // SUPPRESSION DE revalidatePath ICI
        // Le composant client va gérer la mise à jour lui-même
        // revalidatePath('/superadmin/support')

        return {success: true, message}
    } catch (error) {
        console.error('Erreur sendAdminMessage:', error)
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

        // SUPPRESSION DE revalidatePath ICI
        // revalidatePath('/superadmin/support')

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

        // SUPPRESSION DE revalidatePath ICI
        // revalidatePath('/superadmin/support')

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
        console.log('🔍 Récupération du ticket:', ticketId)

        // Vérifier que l'utilisateur est SuperAdmin
        await verifySuperAdmin()

        /**
         * Chargement du ticket avec les informations du restaurant.
         *
         * D'après votre schéma, le modèle Restaurant possède :
         * - id, name, slug, phone, address, logoUrl, etc.
         *
         * Nous allons sélectionner les champs pertinents pour l'affichage
         * dans l'interface SuperAdmin. Le champ phone existe bien dans votre
         * schéma, donc nous pouvons le récupérer directement.
         */
        const ticket = await prisma.supportTicket.findUnique({
            where: {id: ticketId},
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,  // ✅ Ce champ existe dans votre schéma
                        address: true, // Bonus : utile pour le contexte
                    }
                },
                _count: {
                    select: {messages: true}
                }
            }
        })

        console.log('✅ Ticket trouvé:', ticket ? 'Oui' : 'Non')

        if (!ticket) {
            return {success: false, error: 'Ticket introuvable'}
        }

        /**
         * Maintenant, nous devons récupérer l'email de contact du restaurant.
         *
         * Stratégie :
         * Dans votre architecture, les informations utilisateur (y compris l'email)
         * sont gérées par Supabase Auth, pas par Prisma. Nous allons donc :
         *
         * 1. Trouver un utilisateur associé à ce restaurant via RestaurantUser
         * 2. Récupérer son email depuis Supabase Auth
         *
         * Cette approche est cohérente avec votre séparation des responsabilités
         * entre Supabase (auth) et Prisma (données métier).
         */

            // Trouver le premier utilisateur admin de ce restaurant
        const restaurantUser = await prisma.restaurantUser.findFirst({
                where: {
                    restaurantId: ticket.restaurantId,
                    // On cherche soit un admin système, soit quelqu'un avec un rôle admin personnalisé
                    OR: [
                        {role: 'admin'},
                        {
                            customRole: {
                                name: 'Admin'
                            }
                        }
                    ]
                },
                include: {
                    customRole: true
                }
            })

        // Récupérer l'email depuis Supabase Auth si nous avons trouvé un utilisateur
        let contactEmail = null
        if (restaurantUser?.userId) {
            try {
                const supabase = await createClient()
                const {data: userData} = await supabase.auth.admin.getUserById(
                    restaurantUser.userId
                )
                contactEmail = userData?.user?.email || null
            } catch (emailError) {
                console.warn('Impossible de récupérer l\'email depuis Supabase:', emailError)
                // On continue sans l'email plutôt que de faire échouer toute la requête
            }
        }

        /**
         * Construction de l'objet enrichi qui correspond à la structure
         * attendue par nos composants de chat.
         *
         * Nous combinons :
         * - Les données Prisma du restaurant (nom, téléphone, adresse)
         * - L'email récupéré depuis Supabase Auth
         */
        const enrichedTicket = {
            ...ticket,
            restaurant: {
                ...ticket.restaurant,
                email: contactEmail || `contact@${ticket.restaurant.name.toLowerCase().replace(/\s+/g, '-')}.com`,
                // Le téléphone vient déjà de Prisma, on le garde tel quel
            }
        }

        return {success: true, ticket: enrichedTicket}
    } catch (error) {
        console.error('❌ Erreur getTicketById:', error)
        return {success: false, error: 'Erreur lors du chargement du ticket'}
    }
}
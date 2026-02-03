// components/users/InvitationsSection.tsx
// Server Component — pas de 'use client'

import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { InvitationsList } from './InvitationsList'
import { Separator } from '@/components/ui/separator'

export async function InvitationsSection() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Récupérer le restaurant de l'utilisateur connecté
    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
        select: { restaurantId: true },
    })

    if (!restaurantUser) return null

    const rawInvitations = await prisma.invitation.findMany({
        where: {
            restaurantId: restaurantUser.restaurantId,
        },
        include: {
            role: true,
        },
        orderBy: [
            { status: 'asc' },    // pendantes d'abord
            { createdAt: 'desc' }, // puis les plus récentes
        ],
    })

    if (rawInvitations.length === 0) return null

    const invitations = rawInvitations.map((inv) => ({
        id:         inv.id,
        email:      inv.email,
        role:       inv.role.name,   // "admin" | "kitchen" — vient du modèle Role
        token:      inv.token,
        status:     inv.status,
        expiresAt:  inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        createdAt:  inv.createdAt,
    }))

    const pendingCount = invitations.filter((i) => i.status === 'pending').length

    return (
        <>
            <Separator className="mb-5 mt-10" />

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold">Invitations</h3>
                    <p className="text-sm text-muted-foreground">
                        {pendingCount} invitation{pendingCount !== 1 ? 's' : ''} en attente
                    </p>
                </div>
            </div>

            <InvitationsList invitations={invitations} />
        </>
    )
}
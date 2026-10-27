// lib/change-due/totals.ts
import prisma from '@/lib/prisma'

export interface ChangeDueTotals {
    /** Monnaie conservée ce jour-là (entrée de cash non acquise au commerce). */
    created: number
    /** Monnaie rendue ou déduite ce jour-là (sortie de cash). */
    settled: number
    /** Passif total encore dû aux clients, toutes dates confondues. */
    outstandingTotal: number
}

/**
 * Agrège la monnaie due pour une date de session donnée.
 *
 * Impact sur le tiroir, et pourquoi :
 *   - `created`  : le client a laissé l'argent dans le tiroir → le cash
 *                  physique est supérieur à la recette encaissée.
 *   - `settled`  : la monnaie quitte le tiroir, que ce soit en espèces rendues
 *                  ou en déduction d'un achat (dans ce cas la recette est
 *                  enregistrée au montant plein, mais le client paie moins).
 *   - `cancelled`: AUCUN impact. L'argent est déjà dans le tiroir et y reste ;
 *                  seul le passif envers les clients disparaît.
 *
 * Ne vérifie aucune autorisation : l'appelant doit avoir déjà validé l'accès
 * et fourni un `restaurantId` de confiance.
 */
export async function getChangeDueTotals(
    restaurantId: string,
    sessionDate: Date,
): Promise<ChangeDueTotals> {
    const [created, settled, outstanding] = await Promise.all([
        prisma.changeDue.aggregate({
            where: {restaurantId, dueDate: sessionDate},
            _sum: {amount: true},
        }),
        prisma.changeDue.aggregate({
            where: {restaurantId, status: 'settled', settledDate: sessionDate},
            _sum: {amount: true},
        }),
        prisma.changeDue.aggregate({
            where: {restaurantId, status: 'outstanding'},
            _sum: {amount: true},
        }),
    ])

    return {
        created: created._sum.amount ?? 0,
        settled: settled._sum.amount ?? 0,
        outstandingTotal: outstanding._sum.amount ?? 0,
    }
}

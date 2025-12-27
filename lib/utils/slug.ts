// lib/utils/slug.ts
import prisma from '@/lib/prisma'

/**
 * Génère un slug depuis un nom
 * "Chez Maman" → "chez-maman"
 * "L'Étoile d'Or" → "l-etoile-d-or"
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD') // Sépare les caractères accentués
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplace tout ce qui n'est pas alphanumérique par un tiret
        .replace(/^-+|-+$/g, '') // Supprime les tirets au début et à la fin
}

/**
 * Génère un slug unique en ajoutant un suffixe si nécessaire
 * "chez-maman" existe déjà → "chez-maman-2"
 */
export async function generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name)
    let slug = baseSlug
    let suffix = 1

    // Boucle tant que le slug existe déjà
    while (await slugExists(slug)) {
        suffix++
        slug = `${baseSlug}-${suffix}`
    }

    return slug
}

/**
 * Vérifie si un slug existe déjà en base
 */
async function slugExists(slug: string): Promise<boolean> {
    const count = await prisma.restaurant.count({
        where: { slug }
    })
    return count > 0
}
'use server'

import prisma from '@/lib/prisma'
import { generateSlug } from '@/lib/utils/slugify'

/**
 * Génère un slug unique en ajoutant un suffixe si nécessaire
 * "chez-maman" existe déjà → "chez-maman-2"
 */
export async function generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name)
    let slug = baseSlug
    let suffix = 1

    while (true) {
        const exists = await prisma.restaurant.count({
            where: { slug },
        })

        if (!exists) return slug

        suffix++
        slug = `${baseSlug}-${suffix}`
    }
}

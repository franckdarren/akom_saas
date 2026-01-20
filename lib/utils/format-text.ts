/**
 * Formate un texte avec une première lettre majuscule
 * "poulet braisé" → "Poulet braisé"
 * "PIZZA MARGHERITA" → "Pizza margherita"
 */
export function capitalizeFirst(text: string): string {
    if (!text) return ''
    
    // Trim + supprimer les espaces multiples
    const cleaned = text.trim().replace(/\s+/g, ' ')
    
    if (cleaned.length === 0) return ''
    
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
}


/**
 * Formate une description (gère les phrases multiples)
 * "délicieux plat. servi chaud." → "Délicieux plat. Servi chaud."
 */
export function formatDescription(text: string): string {
    if (!text) return ''
    
    // Trim + supprimer les espaces multiples
    const cleaned = text.trim().replace(/\s+/g, ' ')
    
    if (cleaned.length === 0) return ''
    
    // Diviser par les points, capitaliser chaque phrase
    return cleaned
        .split('. ')
        .map(sentence => {
            const trimmed = sentence.trim()
            if (trimmed.length === 0) return ''
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
        })
        .filter(Boolean)
        .join('. ')
}


/**
 * Formate un nom de restaurant (capitalisation douce)
 * "chez maman" → "Chez Maman"
 * "CHEZ MAMAN" → "Chez Maman"
 * "Chez Maman" → "Chez Maman" (pas de changement)
 */
export function formatRestaurantName(text: string): string {
    if (!text) return ''
    
    const cleaned = text.trim().replace(/\s+/g, ' ')
    
    if (cleaned.length === 0) return ''
    
    // Si tout en majuscules OU tout en minuscules, appliquer Title Case
    if (cleaned === cleaned.toUpperCase() || cleaned === cleaned.toLowerCase()) {
        return cleaned
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }
    
    // Sinon, ne rien changer (respecter le style du restaurateur)
    return cleaned
}


/**
 * Nettoie un prix (supprime les caractères non numériques)
 * "2 500 F" → 2500
 * "2500 FCFA" → 2500
 */
export function cleanPrice(input: string | number): number {
    if (typeof input === 'number') return Math.floor(input)
    
    // Supprimer tout sauf les chiffres
    const cleaned = input.replace(/[^\d]/g, '')
    
    return parseInt(cleaned) || 0
}
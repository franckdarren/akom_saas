/*************************************************************
 * Génère un slug depuis un nom
 * "Chez Maman" → "chez-maman"
 * "L'Étoile d'Or" → "l-etoile-d-or"
 ************************************************************/
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

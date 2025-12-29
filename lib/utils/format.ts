export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date)
}

/**
 * Formate un nombre pour l'affichage (espaces tous les 3 chiffres)
 * 1000 → "1 000"
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num)
}
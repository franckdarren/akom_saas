// ============================================================
// Formatage des montants
// ============================================================

export function formatPrice(price: number) {
    return `${price.toLocaleString('fr-FR')} FCFA`
}


// ============================================================
// Formatage de la date
// ============================================================

export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date)
}


// ============================================================
// Formate un nombre pour l'affichage (espaces tous les 3 chiffres)
// 1000 → "1 000"
// ============================================================

export function formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num)
}
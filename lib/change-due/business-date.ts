// lib/change-due/business-date.ts

/**
 * Date metier du jour, a minuit UTC — format attendu par les colonnes @db.Date.
 *
 * Meme convention que le module caisse (voir lib/actions/cash/open-session.ts) :
 * on passe par la chaine 'YYYY-MM-DD' pour eviter tout decalage de fuseau.
 */
export function todayBusinessDate(): Date {
    return new Date(new Date().toISOString().split('T')[0])
}

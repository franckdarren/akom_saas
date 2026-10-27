// lib/change-due/code.ts

// Alphabet sans caracteres ambigus : ni O/0, ni I/1, ni S/5.
// Le code est lu a voix haute et recopie a la main par la caissiere depuis le
// ticket du client — toute ambiguite visuelle est une source d'erreur.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789'
const CODE_LENGTH = 6

/**
 * Genere un code de retrait aleatoire de 6 caracteres.
 * L'unicite est garantie par l'index unique (restaurant_id, code) en base :
 * l'appelant doit retenter en cas de collision.
 */
export function generateChangeDueCode(): string {
    let code = ''
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    }
    return code
}

/**
 * Normalise une saisie utilisateur avant comparaison avec un code stocke.
 * La caissiere tape souvent en minuscules ou colle un code avec des espaces.
 */
export function normalizeChangeDueCode(input: string): string {
    return input.trim().toUpperCase().replace(/\s+/g, '')
}

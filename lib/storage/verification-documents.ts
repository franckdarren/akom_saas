// lib/storage/verification-documents.ts
// Bucket privé : les documents ne sont lisibles que via URL signée.
// Les URLs stockées en base gardent le format public historique ; le chemin
// de l'objet s'en déduit (ex : "<restaurantId>/identity-123.pdf").

export const VERIFICATION_BUCKET = 'verification-documents'

// Durée de validité des URLs signées (secondes)
export const VERIFICATION_SIGNED_URL_TTL = 60 * 60

const PUBLIC_URL_MARKER = `/object/public/${VERIFICATION_BUCKET}/`

export function verificationPathFromUrl(url: string): string | null {
    const index = url.indexOf(PUBLIC_URL_MARKER)
    if (index === -1) return null
    return decodeURIComponent(url.slice(index + PUBLIC_URL_MARKER.length).split('?')[0])
}

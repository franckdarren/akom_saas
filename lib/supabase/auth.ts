import {cache} from 'react'
import type {User} from '@supabase/supabase-js'
import {createClient} from '@/lib/supabase/server'

/**
 * Récupère l'utilisateur Supabase authentifié, mémoïsé par requête.
 *
 * `supabase.auth.getUser()` effectue un appel réseau au serveur Auth Supabase
 * pour valider le JWT. Sur un seul chargement de page, cet appel était répété
 * de nombreuses fois (middleware, layout, getUserRole, isSuperAdmin, chaque
 * Server Action via requirePermission*). `React.cache()` garantit qu'il n'est
 * exécuté qu'une seule fois par requête serveur.
 *
 * Ne pas utiliser dans le middleware (contexte Edge sans cache React) — il
 * possède son propre client et son propre cycle de vie.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    return user
})

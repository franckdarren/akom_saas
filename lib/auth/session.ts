import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Récupère l'utilisateur connecté et son restaurant actif.
 * Cette fonction est utilisée dans toutes les Server Actions pour vérifier
 * les permissions et récupérer le contexte restaurant.
 */
export async function getCurrentUserAndRestaurant() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    // Récupérer l'utilisateur connecté
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Non authentifié')
    }

    // Récupérer le restaurant associé à cet utilisateur
    // Note : Vous devrez adapter cette requête selon votre schéma exact
    const { data: restaurantUser } = await supabase
        .from('restaurant_users')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .single()

    if (!restaurantUser) {
        throw new Error('Aucun restaurant associé')
    }

    return {
        userId: user.id,
        restaurantId: restaurantUser.restaurant_id,
    }
}
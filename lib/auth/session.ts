import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Récupère l'utilisateur connecté et son restaurant actif.
 * Utilise le cookie akom_current_restaurant_id pour identifier le restaurant
 * sélectionné, ce qui est nécessaire pour les utilisateurs multi-restaurants.
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

    // Lire le restaurant actif depuis le cookie (requis pour les utilisateurs multi-restaurants)
    const currentRestaurantId = cookieStore.get('akom_current_restaurant_id')?.value

    if (!currentRestaurantId) {
        throw new Error('Aucun restaurant sélectionné')
    }

    // Vérifier que l'utilisateur appartient bien à ce restaurant
    const { data: restaurantUser } = await supabase
        .from('restaurant_users')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .eq('restaurant_id', currentRestaurantId)
        .single()

    if (!restaurantUser) {
        throw new Error('Accès refusé à ce restaurant')
    }

    return {
        userId: user.id,
        restaurantId: restaurantUser.restaurant_id,
    }
}

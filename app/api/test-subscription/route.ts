// app/api/test-subscription/route.ts
import { createTrialSubscription, isSubscriptionActive } from '@/lib/actions/subscription'
import { NextResponse } from 'next/server'

export async function GET() {
    // Remplace par un vrai ID de restaurant de ta BDD
    const testRestaurantId = 'ton-restaurant-id-ici'

    // Test 1 : Créer un abonnement
    const result = await createTrialSubscription(testRestaurantId)

    // Test 2 : Vérifier si actif
    const isActive = await isSubscriptionActive(testRestaurantId)

    return NextResponse.json({
        test1_create: result,
        test2_isActive: isActive,
    })
}
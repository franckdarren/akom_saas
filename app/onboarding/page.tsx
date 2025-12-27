// app/onboarding/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateRestaurantForm } from './create-restaurant-form'
import prisma from '@/lib/prisma'
import { ChefHat } from 'lucide-react'

export default async function OnboardingPage() {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Vérifier si l'utilisateur a déjà un restaurant
    const existingRestaurant = await prisma.restaurantUser.findFirst({
        where: { userId: user.id },
    })

    // Si oui, rediriger vers le dashboard
    if (existingRestaurant) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mb-4">
                        <ChefHat className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        Bienvenue sur Akôm !
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                        Créez votre restaurant pour commencer
                    </p>
                </div>

                <CreateRestaurantForm />
            </div>
        </div>
    )
}
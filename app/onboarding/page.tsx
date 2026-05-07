// app/onboarding/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateRestaurantForm } from './create-restaurant-form'
import prisma from '@/lib/prisma'
import { ChefHat } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

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
            <div className="w-full max-w-md lg:max-w-3xl">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center  mb-4">
                        <Logo size="lg" variant="color" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Bienvenue !
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Créez votre structure pour commencer
                    </p>
                </div>

                <CreateRestaurantForm />
            </div>
        </div>
    )
}
// app/onboarding/suspended/page.tsx
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import {signOut} from '@/lib/actions/auth'
import {AlertTriangle, FileText, Mail, LogOut, Clock} from 'lucide-react'

export default async function SuspendedPage() {
    const supabase = await createClient()
    const {
        data: {user},
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Récupérer les infos du restaurant suspendu
    const restaurantUser = await prisma.restaurantUser.findFirst({
        where: {userId: user.id},
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    verificationStatus: true,
                    circuitSheet: {
                        select: {
                            deadlineAt: true,
                            isSubmitted: true,
                            autoSuspendedAt: true,
                        },
                    },
                },
            },
        },
    })

    if (!restaurantUser) {
        redirect('/onboarding')
    }

    const restaurant = restaurantUser.restaurant

    // Si le restaurant n'est pas suspendu, rediriger correctement
    if (restaurant.verificationStatus !== 'suspended') {
        if (restaurant.verificationStatus === 'verified') {
            redirect('/dashboard')
        } else {
            redirect('/onboarding/verification')
        }
    }

    const circuitSheet = restaurant.circuitSheet
    const suspendedAt = circuitSheet?.autoSuspendedAt
        ? new Date(circuitSheet.autoSuspendedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : null

    async function handleSignOut() {
        'use server'
        await signOut()
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            {/* Fond avec texture subtile */}
            <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-zinc-950 to-zinc-950"/>

            <div className="relative w-full max-w-lg">
                {/* Card principale */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">

                    {/* Bandeau d'alerte en haut */}
                    <div className="bg-red-950/60 border-b border-red-900/50 px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-red-900/50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-400"/>
                        </div>
                        <div>
                            <p className="text-red-300 font-semibold text-sm">Compte suspendu</p>
                            <p className="text-red-400/70 text-xs">Accès temporairement restreint</p>
                        </div>
                        {suspendedAt && (
                            <div className="ml-auto flex items-center gap-1.5 text-red-400/60 text-xs">
                                <Clock className="w-3.5 h-3.5"/>
                                <span>Depuis le {suspendedAt}</span>
                            </div>
                        )}
                    </div>

                    {/* Corps */}
                    <div className="px-8 py-8">
                        {/* Nom du restaurant */}
                        <p className="text-zinc-500 text-sm font-medium mb-1">Restaurant</p>
                        <h1 className="text-white text-2xl font-bold mb-6">{restaurant.name}</h1>

                        {/* Explication */}
                        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 mb-6">
                            <h2 className="text-white font-semibold mb-2 text-sm">
                                Pourquoi mon compte est-il suspendu ?
                            </h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Votre restaurant a été suspendu automatiquement car la{' '}
                                <span className="text-zinc-200 font-medium">fiche circuit</span>{' '}
                                requise pour les offres Business n'a pas été soumise dans le délai imparti
                                de 3 mois après l'activation de votre abonnement.
                            </p>
                        </div>

                        {/* Étapes pour débloquer */}
                        <h2 className="text-white font-semibold text-sm mb-4">
                            Comment débloquer votre compte ?
                        </h2>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-start gap-3">
                                <div
                                    className="flex-shrink-0 w-6 h-6 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center mt-0.5">
                                    <span className="text-amber-400 text-xs font-bold">1</span>
                                </div>
                                <div>
                                    <p className="text-zinc-300 text-sm font-medium">Contactez le support Akôm</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        Expliquez votre situation et demandez la procédure de réactivation
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div
                                    className="flex-shrink-0 w-6 h-6 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center mt-0.5">
                                    <span className="text-amber-400 text-xs font-bold">2</span>
                                </div>
                                <div>
                                    <p className="text-zinc-300 text-sm font-medium">Soumettez votre fiche circuit</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        Préparez et envoyez le document officiel de fiche circuit
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div
                                    className="flex-shrink-0 w-6 h-6 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center mt-0.5">
                                    <span className="text-amber-400 text-xs font-bold">3</span>
                                </div>
                                <div>
                                    <p className="text-zinc-300 text-sm font-medium">Réactivation sous 24–48h</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        Après validation par notre équipe, votre accès sera rétabli
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bouton contact support */}
                        <a
                            href="mailto:support@akom.app?subject=Demande de réactivation - Restaurant suspendu"
                            className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold py-3 px-4 rounded-xl transition-colors duration-200 text-sm mb-3"
                        >
                            <Mail className="w-4 h-4"/>
                            Contacter le support
                        </a>

                        {/* Bouton déconnexion */}
                        <form action={handleSignOut}>
                            <button
                                type="submit"
                                className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 font-medium py-3 px-4 rounded-xl transition-colors duration-200 text-sm"
                            >
                                <LogOut className="w-4 h-4"/>
                                Se déconnecter
                            </button>
                        </form>
                    </div>
                </div>

                {/* Mention légale */}
                <p className="text-center text-zinc-600 text-xs mt-4">
                    Akôm SaaS · Si vous pensez qu'il s'agit d'une erreur, contactez-nous
                </p>
            </div>
        </div>
    )
}
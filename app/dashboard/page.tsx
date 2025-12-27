import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut, isSuperAdmin } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { RestaurantSelector } from '@/components/dashboard/RestaurantSelector'

export default async function DashboardPage() {
    const supabase = await createClient()

    // Récupérer l'utilisateur connecté
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Rediriger si non authentifié (sécurité supplémentaire)
    if (!user) {
        redirect('/login')
    }

    // Vérifier si SuperAdmin
    const isSuper = await isSuperAdmin()

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-6">
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                                Akôm Dashboard
                            </h1>
                            <RestaurantSelector />
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Badge SuperAdmin */}
                            {isSuper && (
                                <Link href="/superadmin">
                                    <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm font-medium rounded-full cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors">
                                        🚀 Super Admin
                                    </span>
                                </Link>
                            )}

                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                {user.email}
                            </div>
                            <form action={signOut}>
                                <Button type="submit" variant="outline" size="sm">
                                    Déconnexion
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                        Bienvenue sur votre tableau de bord
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        {isSuper
                            ? "Vous êtes SuperAdmin - Vous avez accès à tous les restaurants de la plateforme."
                            : "Sélectionnez un restaurant ci-dessus pour commencer. Votre rôle détermine les fonctionnalités auxquelles vous avez accès."}
                    </p>

                    <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                            Informations de votre compte
                        </h3>
                        <dl className="space-y-2 text-sm">
                            <div>
                                <dt className="text-zinc-600 dark:text-zinc-400 inline">ID:</dt>{' '}
                                <dd className="text-zinc-900 dark:text-zinc-50 inline font-mono">
                                    {user.id}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-zinc-600 dark:text-zinc-400 inline">
                                    Email:
                                </dt>{' '}
                                <dd className="text-zinc-900 dark:text-zinc-50 inline">
                                    {user.email}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-zinc-600 dark:text-zinc-400 inline">
                                    Rôle:
                                </dt>{' '}
                                <dd className="text-zinc-900 dark:text-zinc-50 inline">
                                    {isSuper ? '🚀 Super Admin' : 'Utilisateur'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-zinc-600 dark:text-zinc-400 inline">
                                    Créé le:
                                </dt>{' '}
                                <dd className="text-zinc-900 dark:text-zinc-50 inline">
                                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Link href="/update-password">
                            <Button variant="outline">
                                Modifier mon mot de passe
                            </Button>
                        </Link>
                        {isSuper && (
                            <Link href="/superadmin">
                                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                    Accéder au Dashboard SuperAdmin
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
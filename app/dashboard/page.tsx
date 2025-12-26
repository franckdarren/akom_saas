import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

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

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            Akôm Dashboard
                        </h1>

                        <div className="flex items-center gap-4">
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
                        Vous êtes maintenant connecté avec succès. Cette page est protégée
                        et accessible uniquement aux utilisateurs authentifiés.
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
                                    Créé le:
                                </dt>{' '}
                                <dd className="text-zinc-900 dark:text-zinc-50 inline">
                                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="mt-6">
                        <Link href="/update-password">
                            <Button variant="outline" className="w-full">
                                Modifier mon mot de passe
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/actions/auth'
import prisma from '@/lib/prisma'

export default async function SuperAdminPage() {
    // Vérifier que l'utilisateur est SuperAdmin
    const isSuper = await isSuperAdmin()

    if (!isSuper) {
        redirect('/dashboard')
    }

    // Statistiques globales de la plateforme
    const [totalRestaurants, totalOrders, totalRevenue, restaurantUsers] =
        await Promise.all([
            prisma.restaurant.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: {
                    totalAmount: true,
                },
                where: {
                    status: 'delivered',
                },
            }),
            prisma.restaurantUser.findMany({
                select: {
                    userId: true,
                },
                distinct: ['userId'],
            }),
        ])

    const activeUsers = restaurantUsers.length

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
            <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            🚀 SuperAdmin Dashboard
                        </h1>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm font-medium rounded-full">
                            Super Admin
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        Statistiques de la plateforme
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                        Vue d'ensemble de tous les restaurants Akôm
                    </p>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Restaurants
                        </div>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">
                            {totalRestaurants}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Commandes totales
                        </div>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">
                            {totalOrders}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Chiffre d'affaires
                        </div>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">
                            {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XAF',
                                minimumFractionDigits: 0,
                            }).format(totalRevenue._sum.totalAmount || 0)}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Utilisateurs actifs
                        </div>
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">
                            {activeUsers}
                        </div>
                    </div>
                </div>

                {/* Liste des restaurants */}
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                        Tous les restaurants
                    </h3>
                    <div className="space-y-4">
                        {/* TODO: Ajouter la liste complète avec filtres et pagination */}
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Liste détaillée à venir...
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
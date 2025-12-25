// import { prisma } from '@/lib/prisma'
import prisma from '../../lib/prisma'


export default async function TestPage() {
    try {
        // Test de connexion Prisma
        await prisma.$connect()

        // Compter les restaurants
        const restaurantCount = await prisma.restaurant.count()

        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">✅ Test de connexion</h1>
                <p>Nombre de restaurants : {restaurantCount}</p>
                <p className="text-green-600">Prisma fonctionne !</p>
            </div>
        )
    } catch (error) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4 text-red-600">❌ Erreur</h1>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(error, null, 2)}
                </pre>
            </div>
        )
    }
}
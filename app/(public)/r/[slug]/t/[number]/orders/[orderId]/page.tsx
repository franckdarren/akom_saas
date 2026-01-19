// app/r/[slug]/t/[number]/orders/[orderId]/page.tsx
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { OrderTracker } from '@/components/orders/OrderTracker'

interface PageProps {
    params: Promise<{
        slug: string      // Slug du restaurant (ex: "chez-maman")
        number: string    // Numéro de la table (ex: "5")
        orderId: string   // UUID de la commande
    }>
}

/**
 * Page de suivi de commande avec contexte complet
 * 
 * Cette page permet au client de suivre sa commande en temps réel
 * tout en gardant le contexte du restaurant et de la table.
 * 
 * URL d'accès : /r/[slug]/t/[number]/orders/[orderId]
 * Exemple : /r/chez-maman/t/5/orders/abc-123-def
 * 
 * Le fait de garder le slug et le numéro de table dans l'URL permet :
 * - Un retour facile au menu (bouton "Retour au menu")
 * - Une meilleure expérience utilisateur (contexte préservé)
 * - Des URLs plus lisibles et SEO-friendly
 */
export default async function OrderTrackingPage({ params }: PageProps) {
    try {
        const { slug, number, orderId } = await params

        console.log('============================================')
        console.log('🔍 [PAGE] Suivi de commande avec contexte')
        console.log('📍 Restaurant:', slug)
        console.log('🪑 Table:', number)
        console.log('📦 Commande:', orderId)
        console.log('============================================')

        // ============================================================
        // ÉTAPE 1 : Validation des paramètres d'URL
        // ============================================================

        // Validation du slug du restaurant
        // Format attendu : lettres minuscules, chiffres, et tirets uniquement
        // Exemples valides : "chez-maman", "resto-2000", "le-bon-gout"
        const slugRegex = /^[a-z0-9-]+$/
        if (!slug || !slugRegex.test(slug)) {
            console.log('❌ [PAGE] Slug invalide:', slug)
            notFound()
        }

        // Validation du numéro de table
        // Doit être un nombre entier positif
        const tableNumber = parseInt(number, 10)
        if (isNaN(tableNumber) || tableNumber <= 0) {
            console.log('❌ [PAGE] Numéro de table invalide:', number)
            notFound()
        }

        // Validation de l'UUID de la commande
        // Format UUID standard (8-4-4-4-12 caractères hexadécimaux)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!orderId || !uuidRegex.test(orderId)) {
            console.log('❌ [PAGE] UUID de commande invalide:', orderId)
            notFound()
        }

        // ============================================================
        // ÉTAPE 2 : Récupération du restaurant
        // ============================================================

        // Récupérer le restaurant par son slug
        // Le slug est unique et indexé, donc cette requête est très rapide
        const restaurant = await prisma.restaurant.findUnique({
            where: {
                slug: slug,
                isActive: true, // On ne veut que les restaurants actifs
            },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                phone: true,
            },
        })

        if (!restaurant) {
            console.log('❌ [PAGE] Restaurant non trouvé ou inactif')
            notFound()
        }

        console.log('✅ [PAGE] Restaurant trouvé:', restaurant.name)

        // ============================================================
        // ÉTAPE 3 : Récupération de la table
        // ============================================================

        // Vérifier que la table existe et appartient bien à ce restaurant
        // Cela empêche quelqu'un d'accéder à une commande en bricolant l'URL
        const table = await prisma.table.findFirst({
            where: {
                restaurantId: restaurant.id,
                number: tableNumber,
                isActive: true,
            },
            select: {
                id: true,
                number: true,
            },
        })

        if (!table) {
            console.log('❌ [PAGE] Table non trouvée ou inactive')
            notFound()
        }

        console.log('✅ [PAGE] Table trouvée: Table', table.number)

        // ============================================================
        // ÉTAPE 4 : Récupération de la commande
        // ============================================================

        // Récupérer la commande avec tous ses détails
        // On vérifie TROIS conditions pour la sécurité :
        // 1. L'ID de la commande correspond
        // 2. La commande appartient au bon restaurant
        // 3. La commande appartient à la bonne table
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                restaurantId: restaurant.id,
                tableId: table.id,
            },
            include: {
                orderItems: {
                    select: {
                        id: true,
                        productName: true,
                        quantity: true,
                        unitPrice: true,
                    },
                },
            },
        })

        // Vérifier que la commande a bien un numéro
        if (!order?.orderNumber) {
            console.error('❌ [PAGE] Commande sans numéro:', order?.id)
            notFound()
        }

        // ============================================================
        // CAS SPÉCIAL : Redirection Intelligente
        // ============================================================

        // Si la commande n'existe pas avec ce contexte précis,
        // peut-être qu'elle existe mais pour un autre restaurant/table ?
        // Dans ce cas, on redirige automatiquement vers la bonne URL
        if (!order) {
            console.log('❌ [PAGE] Commande non trouvée avec ce contexte')

            // Chercher si la commande existe ailleurs
            const realOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    restaurant: {
                        select: { slug: true },
                    },
                    table: {
                        select: { number: true },
                    },
                },
            })

            // Si on trouve la commande avec un contexte différent,
            // rediriger vers la bonne URL
            if (realOrder?.restaurant && realOrder?.table) {
                console.log('🔀 [PAGE] Redirection vers la bonne URL')
                console.log('   Bon restaurant:', realOrder.restaurant.slug)
                console.log('   Bonne table:', realOrder.table.number)

                const correctUrl = `/r/${realOrder.restaurant.slug}/t/${realOrder.table.number}/orders/${orderId}`
                redirect(correctUrl)
            }

            // Si on ne trouve la commande nulle part, c'est vraiment un 404
            console.log('❌ [PAGE] Commande introuvable dans tout le système')
            notFound()
        }

        console.log('✅ [PAGE] Commande chargée:', order.orderNumber, 'Statut:', order.status)
        console.log('   Items:', order.orderItems.length)
        console.log('   Total:', order.totalAmount, 'FCFA')

        // ============================================================
        // ÉTAPE 5 : Transformation des données pour le composant
        // ============================================================

        // Le composant OrderTracker attend un format spécifique
        // avec des noms de propriétés en snake_case (convention API)
        // On transforme les données Prisma (camelCase) vers ce format
        const orderData = {
            id: order.id,
            order_number: order.orderNumber,
            status: order.status as 'pending' | 'preparing' | 'ready' | 'delivered',
            total_amount: order.totalAmount,
            customer_name: order.customerName,
            created_at: order.createdAt.toISOString(),
            updated_at: order.updatedAt.toISOString(),
            order_items: order.orderItems.map((item) => ({
                id: item.id,
                product_name: item.productName,
                quantity: item.quantity,
                unit_price: item.unitPrice,
            })),
        }

        const restaurantData = {
            slug: restaurant.slug,
            name: restaurant.name,
            logo_url: restaurant.logoUrl,
            phone: restaurant.phone,
        }

        const tableData = {
            number: table.number,
        }

        

        // ============================================================
        // RENDU FINAL
        // ============================================================

        return (
            <OrderTracker
                order={orderData}
                restaurant={restaurantData}
                table={tableData}
            />
        )
    } catch (error: any) {
        console.error('💥 [PAGE] Erreur inattendue:', error)

        // Next.js utilise des erreurs spéciales pour la navigation
        // (notFound() et redirect() lancent des erreurs en interne)
        // Il faut les relancer telles quelles pour que Next.js les gère
        if (
            error?.digest?.includes('NEXT_NOT_FOUND') ||
            error?.digest?.includes('NEXT_REDIRECT')
        ) {
            throw error
        }

        // Pour toute autre erreur, afficher un 404
        // En production, vous pourriez logger cette erreur dans un service
        // de monitoring comme Sentry pour être alerté des problèmes
        console.error('💥 [PAGE] Erreur non gérée, affichage 404')
        notFound()
    }
}

/**
 * Génération des métadonnées pour le SEO
 * 
 * Les pages de commande ne doivent PAS être indexées par Google
 * car elles contiennent des informations privées et temporaires
 */
export async function generateMetadata({ params }: PageProps) {
    const { slug, orderId } = await params

    // Récupérer le nom du restaurant pour un titre plus parlant
    const restaurant = await prisma.restaurant.findUnique({
        where: { slug },
        select: { name: true },
    })

    // Récupérer le numéro de commande pour affichage
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { orderNumber: true },
    })

    // Si on ne trouve pas les données, titre générique
    if (!restaurant || !order) {
        return {
            title: 'Commande - Akôm',
            description: 'Suivez votre commande en temps réel',
            robots: 'noindex,nofollow', // Ne pas indexer
        }
    }

    return {
        title: `${order.orderNumber} - ${restaurant.name} | Akôm`,
        description: `Suivez votre commande en temps réel chez ${restaurant.name}`,
        robots: 'noindex,nofollow', // Important : ne jamais indexer les pages de commande
    }
}
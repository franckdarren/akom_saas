// app/api/cron/alert-pending-orders/route.ts

import {NextResponse} from 'next/server'
import prisma from '@/lib/prisma'
import {supabaseAdmin} from '@/lib/supabase/admin' // ✅ Singleton — une seule connexion réutilisée
import {sendPendingOrderAlertEmail} from '@/lib/email/cron-emails'

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRON JOB : Alerte commandes en attente trop longtemps
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fréquence : Toutes les 15 minutes (configurer dans vercel.json)
 *
 * Logique :
 *   1. Chercher les commandes en statut "pending" depuis > THRESHOLD_MINUTES
 *   2. Pour chacune, trouver les admins du restaurant concerné
 *   3. Récupérer leurs emails depuis Supabase Auth (service_role obligatoire)
 *   4. Envoyer un email d'alerte à chaque admin
 *
 * Sécurité :
 *   La route est protégée par CRON_SECRET en header Authorization.
 *   En dev : curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/alert-pending-orders
 *
 * Pourquoi supabaseAdmin pour les emails ?
 *   Les emails sont dans Supabase Auth, pas dans notre BDD Prisma.
 *   supabase.auth.admin.getUserById() nécessite la SERVICE_ROLE_KEY.
 *   La clé anon (createClient standard) retourne 403 silencieusement.
 *
 * Corrections apportées vs version originale :
 *   ✅ supabaseAdmin singleton (au lieu de createClient recréé localement)
 *   ✅ Promise.all pour les appels getUserById (au lieu de for...of séquentiel)
 *   ✅ Promise.all pour les envois d'email
 *   ✅ THRESHOLD_MINUTES = 15 (était 60 — trop tardif pour une alerte utile)
 */

export const dynamic = 'force-dynamic' // Désactive le cache statique Next.js

const THRESHOLD_MINUTES = 15

interface PendingOrderAlert {
    orderNumber: string
    totalAmount: number
    items: {
        productName: string
        quantity: number
        unitPrice: number
    }[]
    minutesOld: number
    createdAt: string
}

export async function GET(req: Request) {
    try {
        // ── Vérification du token ───────────────────────────────────────────
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', {status: 401})
        }

        // ── Seuil temporel ─────────────────────────────────────────────────
        // Les commandes créées AVANT cette date sont concernées
        const thresholdDate = new Date(Date.now() - THRESHOLD_MINUTES * 60 * 1000)

        // ── 1. Commandes en attente trop longtemps ──────────────────────────
        const pendingOrders = await prisma.order.findMany({
            where: {
                status: 'pending',
                createdAt: {lte: thresholdDate},
            },
            include: {
                restaurant: {select: {id: true, name: true}},
                orderItems: {
                    include: {
                        // product.name = nom actuel du produit (plus fiable que le snapshot)
                        product: {select: {name: true}},
                    },
                },
            },
        })

        if (pendingOrders.length === 0) {
            return NextResponse.json({success: true, sent: 0})
        }

        let totalEmailsSent = 0

        for (const order of pendingOrders) {
            // ── 2. Ancienneté de la commande ───────────────────────────────
            const minutesOld = Math.floor(
                (Date.now() - order.createdAt.getTime()) / 60000
            )

            // ── 3. Données pour l'email ────────────────────────────────────
            // Chaque champ est sécurisé avec un fallback pour éviter
            // d'envoyer un email avec des valeurs null ou undefined
            const orderDetails: PendingOrderAlert = {
                orderNumber: order.orderNumber ?? `CMD-${order.id.slice(0, 6)}`,
                totalAmount: Number(order.totalAmount ?? 0),
                minutesOld,
                createdAt: order.createdAt.toISOString(),
                items: order.orderItems.map((item) => ({
                    productName: item.product?.name ?? 'Produit inconnu',
                    quantity: item.quantity ?? 0,
                    unitPrice: Number(item.unitPrice ?? 0),
                })),
            }

            // ── 4. Admins du restaurant ────────────────────────────────────
            // On alerte uniquement les "admin", pas les employés ou la cuisine
            const admins = await prisma.restaurantUser.findMany({
                where: {
                    restaurantId: order.restaurant.id,
                    role: 'admin',
                },
                select: {userId: true},
            })

            if (admins.length === 0) continue

            // ── 5. Emails en parallèle ─────────────────────────────────────
            // ✅ Promise.all : tous les appels Supabase Auth sont lancés
            // simultanément. L'ancienne version faisait N appels en série
            // avec un for...of, ce qui bloquait inutilement
            const emailResults = await Promise.all(
                admins.map((admin) =>
                    supabaseAdmin.auth.admin.getUserById(admin.userId)
                )
            )

            const emails = emailResults
                .filter((r) => !r.error && r.data?.user?.email)
                .map((r) => r.data.user!.email!)

            if (emails.length === 0) continue

            // ── 6. Envoi des emails en parallèle ──────────────────────────
            await Promise.all(
                emails.map(async (email) => {
                    await sendPendingOrderAlertEmail({
                        to: email,
                        restaurantName: order.restaurant.name,
                        order: orderDetails,
                    })
                    totalEmailsSent++
                })
            )
        }

        return NextResponse.json({
            success: true,
            processedOrders: pendingOrders.length,
            emailsSent: totalEmailsSent,
        })
    } catch (error) {
        console.error('CRON ERROR [alert-pending-orders]:', error)
        return new NextResponse('Internal Server Error', {status: 500})
    }
}
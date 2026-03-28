// lib/email/cron-emails.ts

/**
 * FONCTIONS D'ENVOI D'EMAIL POUR LES TÂCHES CRON
 */

import nodemailer from 'nodemailer'
import { emailColors as c } from './colors'

// ============================================================
// CONFIGURATION DU TRANSPORTEUR SMTP
// ============================================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

const FROM_EMAIL = `"${process.env.FROM_NAME || 'Akôm'}" <${process.env.FROM_EMAIL || 'noreply@akom.app'}>`

// ============================================================
// TYPES POUR LES DONNÉES D'EMAIL
// ============================================================

export interface StockAlert {
    productName: string
    categoryName: string
    currentQuantity: number
    alertThreshold: number
    difference: number
}

export interface PendingOrderAlert {
    orderNumber: string
    // ❌ tableNumber retiré
    totalAmount: number
    minutesOld: number
    createdAt: string
    items: Array<{
        productName: string
        quantity: number
        unitPrice: number
    }>
}

export interface DailyReportData {
    restaurantName: string
    date: string
    ordersCount: number
    revenue: number
    avgBasket: number
    topProducts: Array<{
        name: string
        quantity: number
        revenue: number
    }>
    statusBreakdown: Record<string, number>
    comparison: {
        previousDay: number
        evolution: number
    }
}

export interface WeeklyReportData {
    restaurantName: string
    weekStart: string
    weekEnd: string
    totalOrders: number
    totalRevenue: number
    avgDailyOrders: number
    avgDailyRevenue: number
    topProducts: Array<{
        name: string
        quantity: number
        revenue: number
    }>
    dailyBreakdown: Array<{
        date: string
        orders: number
        revenue: number
    }>
    comparison: {
        previousWeek: {
            orders: number
            revenue: number
        }
        evolution: {
            orders: number
            revenue: number
        }
    }
}

// ============================================================
// 1. ALERTES DE STOCK BAS
// ============================================================

export async function sendStockAlertEmail({
                                              to,
                                              restaurantName,
                                              alerts,
                                          }: {
    to: string
    restaurantName: string
    alerts: StockAlert[]
}) {
    const subject = `⚠️ Alerte stock bas - ${restaurantName}`

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: ${c.foreground}; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${c.destructive}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: ${c.mutedBg}; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert-item { background-color: ${c.background}; padding: 15px; margin-bottom: 10px; border-left: 4px solid ${c.destructive}; border-radius: 4px; }
        .product-name { font-weight: bold; font-size: 16px; color: ${c.foreground}; }
        .category { color: ${c.mutedForeground}; font-size: 14px; }
        .stock-info { margin-top: 8px; }
        .critical { color: ${c.destructive}; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: ${c.mutedForeground}; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">⚠️ Alerte Stock Bas</h1>
            <p style="margin: 5px 0 0 0;">${restaurantName}</p>
        </div>
        <div class="content">
            <p>Bonjour,</p>
            <p><strong>${alerts.length} produit(s)</strong> de votre restaurant ont atteint ou dépassé leur seuil d'alerte de stock :</p>

            ${alerts
        .map(
            alert => `
            <div class="alert-item">
                <div class="product-name">${alert.productName}</div>
                <div class="category">${alert.categoryName}</div>
                <div class="stock-info">
                    <span class="critical">Stock actuel : ${alert.currentQuantity}</span> /
                    Seuil d'alerte : ${alert.alertThreshold}
                    ${
                alert.currentQuantity <= 0
                    ? '<br><span class="critical">⚠️ RUPTURE DE STOCK</span>'
                    : ''
            }
                </div>
            </div>
            `
        )
        .join('')}

            <p style="margin-top: 20px;">
                <strong>Action recommandée :</strong> Réapprovisionnez ces produits dès que possible
                pour éviter toute rupture de stock et garantir la satisfaction de vos clients.
            </p>

            <p>
                Vous pouvez gérer vos stocks directement depuis votre dashboard Akôm.
            </p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement par Akôm</p>
            <p>Si vous ne souhaitez plus recevoir ces alertes, contactez le support.</p>
        </div>
    </div>
</body>
</html>
    `

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        })
    } catch (error) {
        throw new Error(`Erreur envoi email alerte stock: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
}

// ============================================================
// 2. ALERTES COMMANDES NON TRAITÉES
// ============================================================

export async function sendPendingOrderAlertEmail({
                                                     to,
                                                     restaurantName,
                                                     order,
                                                 }: {
    to: string
    restaurantName: string
    order: PendingOrderAlert
}) {
    const subject = `🚨 URGENT - Commande non traitée depuis ${order.minutesOld}min - ${restaurantName}`

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: ${c.foreground}; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${c.destructive}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .urgent { font-size: 24px; font-weight: bold; }
        .content { background-color: ${c.mutedBg}; padding: 20px; border-radius: 0 0 8px 8px; }
        .order-box { background-color: ${c.background}; padding: 20px; border: 2px solid ${c.destructive}; border-radius: 8px; margin: 15px 0; }
        .order-number { font-size: 20px; font-weight: bold; color: ${c.destructive}; }
        .item { padding: 8px 0; border-bottom: 1px solid ${c.border}; }
        .warning { background-color: ${c.warningBg}; border-left: 4px solid ${c.warning}; padding: 10px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="urgent">🚨 ALERTE URGENTE</div>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Commande non traitée</p>
        </div>
        <div class="content">
            <div class="warning">
                ⚠️ <strong>Une commande attend depuis ${order.minutesOld} minutes sans être prise en charge !</strong>
            </div>

            <div class="order-box">
                <div class="order-number">Commande ${order.orderNumber}</div>
                <p style="margin: 5px 0;">
                    <strong>Montant :</strong> ${order.totalAmount.toLocaleString()} FCFA<br>
                    <strong>Créée à :</strong> ${new Date(order.createdAt).toLocaleString('fr-FR')}
                </p>

                <h3>Détail des produits :</h3>
                ${order.items
        .map(
            item => `
                <div class="item">
                    <strong>${item.quantity}x</strong> ${item.productName}
                    <span style="float: right;">${item.unitPrice.toLocaleString()} FCFA</span>
                </div>
                `
        )
        .join('')}
            </div>

            <p>
                <strong>Action immédiate requise :</strong><br>
                Veuillez vérifier l'interface cuisine et prendre en charge cette commande immédiatement
                pour assurer la satisfaction du client.
            </p>

            <p style="color: ${c.mutedForeground}; font-size: 14px;">
                Si cette commande a déjà été traitée et que le statut n'a pas été mis à jour,
                veuillez le faire dans l'interface dès que possible.
            </p>
        </div>
    </div>
</body>
</html>
    `

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        })
    } catch (error) {
        throw new Error(`Erreur envoi email alerte commande: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
}

// ============================================================
// 3. RAPPORTS QUOTIDIENS
// ============================================================

export async function sendDailyReportEmail({
                                               to,
                                               data: reportData,
                                           }: {
    to: string
    data: DailyReportData
}) {
    const subject = `📊 Rapport quotidien - ${reportData.restaurantName} - ${reportData.date}`

    const evolutionColor = reportData.comparison.evolution >= 0 ? c.success : c.destructive
    const evolutionSymbol = reportData.comparison.evolution >= 0 ? '↗' : '↘'

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: ${c.foreground}; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${c.primary}; color: white; padding: 25px; border-radius: 8px 8px 0 0; }
        .content { background-color: ${c.mutedBg}; padding: 20px; border-radius: 0 0 8px 8px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background-color: ${c.background}; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 24px; font-weight: bold; color: ${c.primary}; }
        .stat-label { font-size: 12px; color: ${c.mutedForeground}; text-transform: uppercase; margin-top: 5px; }
        .section { background-color: ${c.background}; padding: 20px; margin: 15px 0; border-radius: 8px; }
        .product-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid ${c.border}; }
        .comparison { text-align: center; padding: 15px; background-color: ${c.infoBg}; border-radius: 8px; margin: 15px 0; }
        .evolution { font-size: 20px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">📊 Rapport Quotidien</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${reportData.restaurantName}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">${reportData.date}</p>
        </div>
        <div class="content">
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value">${reportData.ordersCount}</div>
                    <div class="stat-label">Commandes</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${reportData.revenue.toLocaleString()}</div>
                    <div class="stat-label">CA (FCFA)</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${reportData.avgBasket.toLocaleString()}</div>
                    <div class="stat-label">Panier Moyen</div>
                </div>
            </div>

            <div class="comparison">
                <p style="margin: 0 0 10px 0; color: ${c.mutedForeground}; font-size: 14px;">
                    Comparaison avec la veille (${reportData.comparison.previousDay} commandes)
                </p>
                <div class="evolution" style="color: ${evolutionColor};">
                    ${evolutionSymbol} ${Math.abs(reportData.comparison.evolution)}%
                </div>
            </div>

            <div class="section">
                <h2 style="margin-top: 0; color: ${c.foreground};">🏆 Top 5 des produits</h2>
                ${reportData.topProducts
        .map(
            (product, index) => `
                <div class="product-item">
                    <div>
                        <strong>#${index + 1} ${product.name}</strong><br>
                        <span style="color: ${c.mutedForeground}; font-size: 14px;">
                            ${product.quantity} vente(s)
                        </span>
                    </div>
                    <div style="text-align: right;">
                        <strong>${product.revenue.toLocaleString()} FCFA</strong>
                    </div>
                </div>
                `
        )
        .join('')}
            </div>

            <div class="section">
                <h2 style="margin-top: 0; color: ${c.foreground};">📈 Répartition par statut</h2>
                ${Object.entries(reportData.statusBreakdown)
        .map(
            ([status, count]) => `
                <div class="product-item">
                    <span>${getStatusLabel(status)}</span>
                    <strong>${count}</strong>
                </div>
                `
        )
        .join('')}
            </div>

            <p style="text-align: center; color: ${c.mutedForeground}; margin-top: 25px;">
                Continuez comme ça ! 🎉<br>
                Consultez votre dashboard pour plus de détails.
            </p>
        </div>
    </div>
</body>
</html>
    `

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        })
    } catch (error) {
        throw new Error(`Erreur envoi rapport quotidien: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
}

// ============================================================
// 4. RAPPORTS HEBDOMADAIRES
// ============================================================

export async function sendWeeklyReportEmail({
                                                to,
                                                data: reportData,
                                            }: {
    to: string
    data: WeeklyReportData
}) {
    const subject = `📈 Rapport hebdomadaire - ${reportData.restaurantName} - ${reportData.weekStart} au ${reportData.weekEnd}`

    const ordersEvolution = reportData.comparison.evolution.orders
    const revenueEvolution = reportData.comparison.evolution.revenue

    const ordersColor = ordersEvolution >= 0 ? c.success : c.destructive
    const revenueColor = revenueEvolution >= 0 ? c.success : c.destructive

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: ${c.foreground}; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${c.info}; color: white; padding: 25px; border-radius: 8px 8px 0 0; }
        .content { background-color: ${c.mutedBg}; padding: 20px; border-radius: 0 0 8px 8px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background-color: ${c.background}; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 28px; font-weight: bold; color: ${c.info}; }
        .stat-label { font-size: 13px; color: ${c.mutedForeground}; text-transform: uppercase; margin-top: 8px; }
        .section { background-color: ${c.background}; padding: 20px; margin: 15px 0; border-radius: 8px; }
        .day-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid ${c.border}; }
        .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .comparison-box { text-align: center; padding: 15px; background-color: ${c.cardBg}; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">📈 Rapport Hebdomadaire</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${reportData.restaurantName}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">
                Du ${reportData.weekStart} au ${reportData.weekEnd}
            </p>
        </div>
        <div class="content">
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-value">${reportData.totalOrders}</div>
                    <div class="stat-label">Total Commandes</div>
                    <div style="margin-top: 10px; font-size: 14px; color: ${c.mutedForeground};">
                        Moyenne : ${Math.round(reportData.avgDailyOrders)}/jour
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${reportData.totalRevenue.toLocaleString()}</div>
                    <div class="stat-label">CA Total (FCFA)</div>
                    <div style="margin-top: 10px; font-size: 14px; color: ${c.mutedForeground};">
                        Moyenne : ${Math.round(reportData.avgDailyRevenue).toLocaleString()}/jour
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 style="margin-top: 0; color: ${c.foreground};">📊 Comparaison avec la semaine précédente</h2>
                <div class="comparison-grid">
                    <div class="comparison-box">
                        <div style="font-size: 20px; font-weight: bold; color: ${ordersColor};">
                            ${ordersEvolution >= 0 ? '↗' : '↘'} ${Math.abs(ordersEvolution)}%
                        </div>
                        <div style="font-size: 13px; color: ${c.mutedForeground}; margin-top: 5px;">
                            Commandes (${reportData.comparison.previousWeek.orders} → ${reportData.totalOrders})
                        </div>
                    </div>
                    <div class="comparison-box">
                        <div style="font-size: 20px; font-weight: bold; color: ${revenueColor};">
                            ${revenueEvolution >= 0 ? '↗' : '↘'} ${Math.abs(revenueEvolution)}%
                        </div>
                        <div style="font-size: 13px; color: ${c.mutedForeground}; margin-top: 5px;">
                            Chiffre d'affaires
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 style="margin-top: 0; color: ${c.foreground};">🏆 Top produits de la semaine</h2>
                ${reportData.topProducts
        .map(
            (product, index) => `
                <div class="day-item">
                    <div>
                        <strong>#${index + 1} ${product.name}</strong><br>
                        <span style="color: ${c.mutedForeground}; font-size: 14px;">
                            ${product.quantity} vente(s)
                        </span>
                    </div>
                    <div style="text-align: right;">
                        <strong>${product.revenue.toLocaleString()} FCFA</strong>
                    </div>
                </div>
                `
        )
        .join('')}
            </div>

            <div class="section">
                <h2 style="margin-top: 0; color: ${c.foreground};">📅 Détail par jour</h2>
                ${reportData.dailyBreakdown
        .map(
            day => `
                <div class="day-item">
                    <span>${day.date}</span>
                    <div style="text-align: right;">
                        <strong>${day.orders}</strong> commandes<br>
                        <span style="color: ${c.mutedForeground}; font-size: 14px;">
                            ${day.revenue.toLocaleString()} FCFA
                        </span>
                    </div>
                </div>
                `
        )
        .join('')}
            </div>

            <p style="text-align: center; color: ${c.mutedForeground}; margin-top: 25px;">
                Excellente semaine ! 🚀<br>
                Accédez à votre dashboard pour une analyse détaillée.
            </p>
        </div>
    </div>
</body>
</html>
    `

    try {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        })
    } catch (error) {
        throw new Error(`Erreur envoi rapport hebdomadaire: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
}

// ============================================================
// HELPERS
// ============================================================

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending: '⏳ En attente',
        preparing: '👨‍🍳 En préparation',
        ready: '✅ Prête',
        delivered: '🎉 Livrée',
        cancelled: '❌ Annulée',
    }
    return labels[status] || status
}

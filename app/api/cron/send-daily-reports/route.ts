// app/api/cron/daily-report/route.ts
import {NextResponse} from 'next/server';
import prisma from '@/lib/prisma'; // ton client Prisma

type DailyReportData = {
    restaurantName: string;
    date: string;
    ordersCount: number;
    revenue: number;
    avgBasket: number;
    topProducts: { name: string; quantity: number; revenue: number }[];
    statusBreakdown: Record<string, number>;
    comparison: { previousDay: number; evolution: number };
};

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // 1️⃣ Récupérer tous les restaurants actifs
        const restaurants = await prisma.restaurant.findMany({
            where: {isActive: true},
            select: {id: true, name: true},
        });

        const reports: DailyReportData[] = [];

        for (const restaurant of restaurants) {
            // 2️⃣ Récupérer les stats du jour
            const orders = await prisma.order.findMany({
                where: {
                    restaurantId: restaurant.id,
                    createdAt: {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
                include: {
                    orderItems: true, // ✅ nom exact de la relation
                    payments: true,
                },
            });

            const ordersCount = orders.length;
            const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const avgBasket = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

            // 3️⃣ Status breakdown
            const statusBreakdown: Record<string, number> = {};
            orders.forEach((order) => {
                statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
            });

            // 4️⃣ Top produits
            const topProductsMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
            orders.forEach((order) => {
                order.orderItems.forEach((item) => {
                    if (!topProductsMap[item.productName]) {
                        topProductsMap[item.productName] = {name: item.productName, quantity: 0, revenue: 0};
                    }
                    topProductsMap[item.productName].quantity += item.quantity;
                    topProductsMap[item.productName].revenue += item.quantity * item.unitPrice;
                });
            });
            const topProducts = Object.values(topProductsMap)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            // 5️⃣ Comparaison avec hier
            const yesterdayStats = await prisma.order.aggregate({
                where: {
                    restaurantId: restaurant.id,
                    createdAt: {
                        gte: yesterday,
                        lt: today,
                    },
                },
                _sum: {totalAmount: true},
            });
            const previousDayRevenue = yesterdayStats._sum.totalAmount || 0;
            const evolution =
                previousDayRevenue > 0 ? Math.round(((revenue - previousDayRevenue) / previousDayRevenue) * 100) : 100;

            // 6️⃣ Construire le rapport
            reports.push({
                restaurantName: restaurant.name,
                date: today.toISOString().split('T')[0],
                ordersCount,
                revenue,
                avgBasket,
                topProducts,
                statusBreakdown,
                comparison: {previousDay: previousDayRevenue, evolution},
            });
        }

        // Ici tu peux sauvegarder reports dans DailyStats ou envoyer par mail, etc.
        return NextResponse.json({success: true, reports});
    } catch (error) {
        console.error('Erreur cron daily report:', error);
        return NextResponse.json({success: false, error: (error as Error).message});
    }
}

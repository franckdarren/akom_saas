/**
 * Gestion localStorage des commandes catalogue publiques.
 * Permet aux clients anonymes de retrouver leurs commandes en cours
 * lorsqu'ils reviennent sur le menu.
 */

interface StoredCatalogOrder {
    orderId: string
    orderNumber: string | null
    createdAt: string // ISO string
}

const STORAGE_PREFIX = 'akom_catalog_orders_'
/** Durée de rétention max (24h) */
const MAX_AGE_MS = 24 * 60 * 60 * 1000

function getKey(slug: string): string {
    return `${STORAGE_PREFIX}${slug}`
}

function readOrders(slug: string): StoredCatalogOrder[] {
    try {
        const raw = localStorage.getItem(getKey(slug))
        if (!raw) return []
        const orders: StoredCatalogOrder[] = JSON.parse(raw)
        // Nettoyer les entrées de plus de 24h
        const now = Date.now()
        return orders.filter(
            (o) => now - new Date(o.createdAt).getTime() < MAX_AGE_MS,
        )
    } catch {
        return []
    }
}

function writeOrders(slug: string, orders: StoredCatalogOrder[]): void {
    try {
        localStorage.setItem(getKey(slug), JSON.stringify(orders))
    } catch {
        // localStorage plein ou indisponible — on ignore silencieusement
    }
}

export function saveCatalogOrder(
    slug: string,
    orderId: string,
    orderNumber: string | null,
): void {
    const orders = readOrders(slug)
    // Éviter les doublons
    if (orders.some((o) => o.orderId === orderId)) return
    orders.push({ orderId, orderNumber, createdAt: new Date().toISOString() })
    writeOrders(slug, orders)
}

export function getCatalogOrderIds(slug: string): string[] {
    const orders = readOrders(slug)
    // Mettre à jour le storage avec les entrées nettoyées
    writeOrders(slug, orders)
    return orders.map((o) => o.orderId)
}

export function removeCatalogOrders(slug: string, orderIds: string[]): void {
    const orders = readOrders(slug)
    const filtered = orders.filter((o) => !orderIds.includes(o.orderId))
    writeOrders(slug, filtered)
}

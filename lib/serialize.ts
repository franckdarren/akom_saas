// lib/serializers/warehouse.ts

interface DecimalLike {
    toNumber: () => number
}

function isDecimalLike(v: unknown): v is DecimalLike {
    return typeof v === 'object' && v !== null && typeof (v as DecimalLike).toNumber === 'function'
}

function tryNumber(value: unknown): unknown {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value
    if (isDecimalLike(value)) {
        try {
            return value.toNumber()
        } catch {
            return Number(String(value))
        }
    }
    if (typeof value === 'string') {
        const n = Number(value)
        return Number.isNaN(n) ? value : n
    }
    return value
}

export function deepSerialize(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj

    // Decimal-like -> number
    if (isDecimalLike(obj)) return tryNumber(obj)

    // Dates -> ISO string (safer pour l'hydratation)
    if (obj instanceof Date) return obj.toISOString()

    // Primitives
    if (typeof obj !== 'object') {
        return tryNumber(obj)
    }

    // Arrays
    if (Array.isArray(obj)) {
        return obj.map((v) => deepSerialize(v))
    }

    // Plain object -> récurse sur chaque clé
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        result[k] = v === undefined ? null : deepSerialize(v)
    }
    return result
}

/** Spécifique: wrapper utile pour WarehouseProduct (optionnel) */
export function serializeWarehouseProduct(product: unknown): unknown {
    if (!product) return null
    return deepSerialize(product)
}

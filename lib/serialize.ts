// lib/serializers/warehouse.ts
export function isDecimalLike(v: any): boolean {
    return v && typeof v === 'object' && typeof v.toNumber === 'function';
}

function tryNumber(value: any): any {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (isDecimalLike(value)) {
        try {
            return value.toNumber();
        } catch {
            return Number(String(value));
        }
    }
    if (typeof value === 'string') {
        const n = Number(value);
        return Number.isNaN(n) ? value : n;
    }
    return value;
}

export function deepSerialize(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    // Decimal-like -> number
    if (isDecimalLike(obj)) return tryNumber(obj);

    // Dates -> ISO string (safer pour l'hydratation)
    if (obj instanceof Date) return obj.toISOString();

    // Primitives
    if (typeof obj !== 'object') {
        return tryNumber(obj);
    }

    // Arrays
    if (Array.isArray(obj)) {
        return obj.map((v) => deepSerialize(v));
    }

    // Plain object -> récurse sur chaque clé
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        // Éviter d'appeler toNumber sur undefined
        if (v === undefined) {
            result[k] = null;
            continue;
        }
        result[k] = deepSerialize(v);
    }
    return result;
}

/** Spécifique: wrapper utile pour WarehouseProduct (optionnel) */
export function serializeWarehouseProduct(product: any) {
    if (!product) return null;
    return deepSerialize(product);
}

export function serializeWarehouseProduct(product: any) {
    return {
        ...product,
        conversionRatio: Number(product.conversionRatio),
        stock: product.stock
            ? {
                ...product.stock,
                quantity: Number(product.stock.quantity),
                alertThreshold: Number(product.stock.alertThreshold),
                unitCost: product.stock.unitCost
                    ? Number(product.stock.unitCost)
                    : null,
            }
            : null,
    }
}

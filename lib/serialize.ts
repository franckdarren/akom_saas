export function serializeWarehouseProduct(product: any) {
    return {
        ...product,
        conversionRatio: Number(product.conversionRatio),
        stock: product.stock
            ? product.stock.map((s: any) => ({
                ...s,
                quantity: Number(s.quantity),
                alertThreshold: Number(s.alertThreshold),
                unitCost: s.unitCost !== null ? Number(s.unitCost) : null,
            }))
            : [],
        linkedProduct: product.linkedProduct
            ? {
                ...product.linkedProduct,
                stock: product.linkedProduct.stock
                    ? product.linkedProduct.stock.map((s: any) => ({
                        ...s,
                        quantity: Number(s.quantity),
                        alertThreshold: Number(s.alertThreshold),
                        unitCost: s.unitCost !== null ? Number(s.unitCost) : null,
                    }))
                    : [],
            }
            : null,
    }
}
